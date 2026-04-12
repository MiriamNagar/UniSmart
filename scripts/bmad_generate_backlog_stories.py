"""
One-shot batch generator: creates BMAD story markdown files for all backlog
entries in sprint-status.yaml by extracting ### Story blocks from epics.md.
Run from repo root: python scripts/bmad_generate_backlog_stories.py
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EPICS = ROOT / "_bmad-output/planning-artifacts/epics.md"
SPRINT = ROOT / "_bmad-output/implementation-artifacts/sprint-status.yaml"
IMPL = ROOT / "_bmad-output/implementation-artifacts"
ARCH = "_bmad-output/planning-artifacts/architecture.md"
PRD = "_bmad-output/planning-artifacts/prd.md"
UX = "_bmad-output/planning-artifacts/ux-design-specification.md"
CTX = "_bmad-output/project-context.md"


def extract_story_sections(epics_text: str) -> dict[tuple[int, int], dict[str, str]]:
    pattern = re.compile(r"^### Story (\d+)\.(\d+):\s*(.+)$", re.MULTILINE)
    matches = list(pattern.finditer(epics_text))
    out: dict[tuple[int, int], dict[str, str]] = {}
    for i, m in enumerate(matches):
        epic, story = int(m.group(1)), int(m.group(2))
        title = m.group(3).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(epics_text)
        body = epics_text[start:end].strip()
        out[(epic, story)] = {"title": title, "body": body}
    return out


def split_user_story_and_ac(body: str) -> tuple[str, str]:
    ac_markers = (
        "**Acceptance Criteria:**",
        "**Acceptance criteria:**",
        "Acceptance Criteria:",
    )
    idx = -1
    used = ""
    for mk in ac_markers:
        j = body.find(mk)
        if j != -1:
            idx = j
            used = mk
            break
    if idx == -1:
        return body.strip(), ""
    user_part = body[:idx].strip()
    ac_part = body[idx + len(used) :].strip()
    # Drop a single leading blank line after the heading
    if ac_part.startswith("\n"):
        ac_part = ac_part.lstrip("\n")
    return user_part, ac_part


def backlog_keys(yaml_text: str) -> list[str]:
    keys: list[str] = []
    for line in yaml_text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" not in line:
            continue
        key, _, val = line.partition(":")
        key = key.strip()
        val = val.strip()
        if val != "backlog":
            continue
        if re.match(r"^\d+-\d+-", key):
            keys.append(key)
    return keys


def parse_key(key: str) -> tuple[int, int] | None:
    m = re.match(r"^(\d+)-(\d+)-", key)
    if not m:
        return None
    return int(m.group(1)), int(m.group(2))


EPIC_DEV_NOTES: dict[int, list[str]] = {
    1: [
        "Expo Router groups: `(auth)`, `(student)`, `(admin)`; single Firebase module `@/lib/firebase`.",
        "Role and profile: Firestore `users/{uid}` + `SelectionContext`; align with Story 1.6 routing before changing nav/session.",
        "UX: auth primaries disabled until valid (UX-DR12); teal tokens for shell (UX-DR1–3).",
    ],
    2: [
        "Solver logic stays in `logic/solver/` with **no Firebase imports**; bounded search per NFR-P1 / NFR-SC2.",
        "Catalog: term-scoped data from Firestore seed or fixtures; stale/failure messaging NFR-I1, UX-DR8, UX-DR16.",
        "Planner UI lives under `app/(student)/(planner-flow)/` (or current equivalent); preserve stack state per FR16.",
    ],
    3: [
        "Owner-scoped Firestore paths (e.g. `users/{uid}/savedSchedules`); rules must enforce `request.auth.uid` NFR-S3.",
        "After successful save, navigate to Saved without extra hop FR23 / UX-DR11 / NFR-R1.",
        "Reuse course description display patterns from Epic 2 where applicable FR22.",
    ],
    4: [
        "Firebase Storage for blobs + Firestore metadata; verify Spark/Blaze and rules for new paths.",
        "Admin notes: same UX as student with **strict isolation** NFR-S3.",
        "Loading/error states for attachments NFR-P3; meaningful labels for images UX-DR14.",
    ],
    5: [
        "Expo push + FCM; generic notification bodies NFR-S4; token lifecycle aligned with sign-out (Epic 1 Story 1.7).",
        "Alerts inbox UX-DR3 / UX-DR7; unread indicator not color-only NFR-A1.",
    ],
    6: [
        "Admin analysis: scoped queries, pagination/limits—no unbounded cross-user scans (architecture free-tier hygiene).",
        "Exports: CSV structural validity NFR-I2; system analytics disclaimer UX-DR13 / UX-DR16.",
    ],
    7: [
        "Quality bar: documented E2E paths FR47–FR49; second automated test type beyond Jest solver tests.",
        "Rules emulator or integration tests for RBAC NFR-S3; ops docs NFR-R2.",
        "Accessibility checklist on critical flows UX-DR14 / NFR-A1; COPPA policy documented for birth date.",
    ],
}


def render_story_file(
    *,
    story_key: str,
    epic: int,
    story: int,
    title: str,
    user_block: str,
    ac_block: str,
) -> str:
    sid = f"{epic}.{story}"
    lines: list[str] = [
        f"# Story {sid}: {title}",
        "",
        "Status: ready-for-dev",
        "",
        "<!-- Ultimate context engine analysis completed - comprehensive developer guide created (batch from epics.md) -->",
        "",
        "## Story",
        "",
        user_block.strip(),
        "",
        "## Acceptance Criteria",
        "",
    ]
    if ac_block.strip():
        lines.append(ac_block.strip())
    else:
        lines.append("_See epics.md — acceptance criteria block not auto-detected._")
    lines.extend(
        [
            "",
            "## Tasks / Subtasks",
            "",
            "- [ ] Implement per acceptance criteria above; keep scope aligned with this story only.",
            "- [ ] Add or update tests (unit/integration/manual per story risk).",
            "- [ ] Run `npm run lint` and `npm test`; fix regressions.",
            "",
            "## Dev Notes",
            "",
            "### Developer context (guardrails)",
            "",
        ]
    )
    for note in EPIC_DEV_NOTES.get(epic, ["Follow architecture.md and project-context.md for stack and structure."]):
        lines.append(f"- {note}")
    if story > 1:
        prev_txt = (
            f"Previous story in this epic: `{IMPL.name}/{epic}-{story - 1}-*.md` (patterns, file list)."
        )
    elif epic > 1:
        prev_txt = (
            f"First story in Epic {epic}: ensure Epic {epic - 1} prerequisites and architecture sequencing are satisfied."
        )
    else:
        prev_txt = "First story in Epic 1: use architecture + PRD + existing repo conventions."
    lines.extend(
        [
            f"- {prev_txt}",
            "",
            "### Architecture compliance",
            "",
            f"- Brownfield Expo app; expo-router file layout; see [{ARCH}]({ARCH}).",
            f"- PRD/NFR cross-check: [{PRD}]({PRD}).",
            f"- UX tokens and patterns: [{UX}]({UX}).",
            "",
            "### Library / framework requirements",
            "",
            "- Match versions and patterns in project-context (Expo SDK, React 19, expo-router ~6, Firebase modular SDK).",
            "",
            "### Testing requirements",
            "",
            "- Jest/jest-expo for pure logic; add RNTL or rules tests when story touches UI or Firestore rules.",
            "- Document manual QA steps for UX-heavy stories.",
            "",
            "### Project context reference",
            "",
            f"- [{CTX}]({CTX})",
            "",
            "## References",
            "",
            f"- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic {epic}, Story {sid}]",
            f"- [Source: `{ARCH}` — relevant sections for this epic]",
            f"- [Source: `{CTX}` — implementation rules]",
            "",
            "## Dev Agent Record",
            "",
            "### Agent Model Used",
            "",
            "_Pending implementation_",
            "",
            "### Debug Log References",
            "",
            "### Completion Notes List",
            "",
            "### File List",
            "",
            "## Story completion status",
            "",
            "- **Status:** ready-for-dev",
            "- **Note:** Batch-generated story context from epics.md; refine tasks during dev-story if scope shifts.",
            "",
        ]
    )
    return "\n".join(lines)


def patch_sprint_status(yaml_text: str, keys: list[str]) -> str:
    lines = yaml_text.splitlines()
    key_set = set(keys)
    out: list[str] = []
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("#") and ":" in stripped:
            k, _, v = stripped.partition(":")
            k, v = k.strip(), v.strip()
            if k in key_set and v == "backlog":
                indent = line[: len(line) - len(line.lstrip())]
                out.append(f"{indent}{k}: ready-for-dev")
                continue
        out.append(line)
    # bump last_updated
    iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    final: list[str] = []
    for line in out:
        if line.startswith("last_updated:"):
            final.append(f'last_updated: "{iso}"')
        elif line.startswith("# last_updated:"):
            final.append(f"# last_updated: {iso}")
        else:
            final.append(line)
    return "\n".join(final) + ("\n" if not out[-1].endswith("\n") else "")


def main() -> None:
    epics_text = EPICS.read_text(encoding="utf-8")
    sections = extract_story_sections(epics_text)
    sprint_text = SPRINT.read_text(encoding="utf-8")
    keys = backlog_keys(sprint_text)
    if not keys:
        print("No backlog story keys found in sprint-status.yaml")
        return

    missing: list[str] = []
    for key in keys:
        ids = parse_key(key)
        if not ids:
            missing.append(key)
            continue
        epic, story = ids
        sec = sections.get((epic, story))
        if not sec:
            missing.append(key)
            continue
        user_block, ac_block = split_user_story_and_ac(sec["body"])
        md = render_story_file(
            story_key=key,
            epic=epic,
            story=story,
            title=sec["title"],
            user_block=user_block,
            ac_block=ac_block,
        )
        out_path = IMPL / f"{key}.md"
        out_path.write_text(md, encoding="utf-8")
        print(f"Wrote {out_path.relative_to(ROOT)}")

    if missing:
        print("ERROR: Missing epics sections for:", ", ".join(missing))
        raise SystemExit(1)

    new_yaml = patch_sprint_status(sprint_text, keys)
    SPRINT.write_text(new_yaml, encoding="utf-8")
    print(f"Updated {SPRINT.relative_to(ROOT)} ({len(keys)} stories -> ready-for-dev)")


if __name__ == "__main__":
    main()
