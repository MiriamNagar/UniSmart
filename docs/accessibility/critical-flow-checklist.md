# Critical Flow Accessibility Checklist

Date: 2026-04-17  
Owner: Dev Story 7.8  
Scope: Auth (`app/(auth)`), planner (`app/(student)/planner.tsx` + planner entry), alerts (`app/(student)/alerts.tsx`)

## Verification method

- Manual screen-reader walkthroughs planned for VoiceOver (iOS) and TalkBack (Android).
- Static code review for semantic roles, labels, hints, and touch target sizing.
- Contrast sanity check on critical instructional text against white backgrounds.

## Checklist results

| Flow | Check | Result | Evidence |
| --- | --- | --- | --- |
| Auth | Primary CTAs have accessible names and button roles | Pass | `sign-in.tsx` and `welcome.tsx` already include `accessibilityRole` + `accessibilityLabel` on sign-in, Google, and account navigation actions |
| Auth | Validation and inline error announcements are announced by screen readers | Pass | `sign-in.tsx` uses `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"` for relevant error states |
| Auth | Contrast on body/field text meets intent | N/A (existing accepted palette) | No auth color changes in this story; existing palette preserved to avoid unintended branding drift in this QA-only scope |
| Planner | Degree-year and semester choices expose selected state to assistive tech | Fixed | Added radio semantics (`accessibilityRole="radiogroup"` / `"radio"`) and selected state in `app/(student)/planner.tsx` |
| Planner | Planner entry action is clearly announced and discoverable | Fixed | Added label/hint to "Begin Course Selection" in `app/(student)/planner.tsx` |
| Planner | Decorative icon does not create noisy screen-reader output | Fixed | Marked icon wrapper as hidden from accessibility tree in `app/(student)/planner.tsx` |
| Planner | Supporting instructional text contrast is readable | Fixed | Darkened low-contrast instructional text colors in `app/(student)/planner.tsx` |
| Alerts | "Mark all read" and "mark read" actions expose intent and target | Fixed | Added explicit labels/hints in `app/(student)/alerts.tsx` |
| Alerts | Tap targets on alert actions are at least touch-friendly | Fixed | Enforced `minHeight: 44` and center alignment for alert action buttons in `app/(student)/alerts.tsx` |
| Alerts | Header/supporting text contrast is readable | Fixed | Darkened low-contrast header subtitle color in `app/(student)/alerts.tsx` |

## VoiceOver / TalkBack path checklist

### Auth path

- Start at welcome screen.
- Swipe to "Sign in" and "Create account" actions; confirm each is announced as button with correct name.
- Enter invalid credentials and confirm errors are announced without moving focus unexpectedly.
- Trigger Google sign-in CTA and confirm disabled/loading states are communicated.

### Planner path

- Navigate to planner home.
- Move through degree-year options and confirm each announces as radio + selected/unselected state.
- Move through semester options and confirm selected state changes are announced.
- Activate "Begin course selection" and confirm navigation to planner flow entry.

### Alerts path

- Open alerts tab with unread items.
- Verify each card reads status, title, and message in logical order.
- Activate "Mark all alerts as read" and confirm state updates.
- For a single unread item, activate `Mark <alert title> as read` and confirm unread count changes.

## Findings log

1. Planner selection controls lacked explicit radio semantics for screen readers.  
   Resolution: Added radiogroup/radio roles and `accessibilityState.selected`.
2. Alerts action buttons had minimal semantic hints and small tap target risks.  
   Resolution: Added contextual hints and enforced minimum 44px target height.
3. Subtle secondary text in planner/alerts had low-contrast risk on white backgrounds.  
   Resolution: Updated key subtitle/instruction colors to darker variants.

## Remaining risks / follow-up

- Manual device run (real VoiceOver and TalkBack) should be executed before release because simulator-only checks can miss rotor/order quirks.
- Full visual contrast audit (all non-critical screens) is out of scope for Story 7.8.
