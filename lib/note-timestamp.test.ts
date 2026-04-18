import { formatNoteTimestamp } from "@/lib/note-timestamp";

describe("formatNoteTimestamp", () => {
  it("returns a readable timestamp for note cards", () => {
    const rendered = formatNoteTimestamp(Date.UTC(2026, 3, 16, 12, 34));
    expect(rendered).toContain("2026");
    expect(rendered).toMatch(/(Apr|April)/);
  });
});
