# Cookie consent verification

Task: Compact nonmodal cookie consent banner
Goal: Keep analytics safeguards intact while making the FI/EN banner compact and nonmodal.

- [x] Replace the modal dialog with a labelled region and visually hidden heading.
- [x] Shorten FI/EN copy; keep equal side-by-side 44px Reject/Accept buttons.
- [x] Remove fresh status, backdrop, focus trap and initial focus movement.
- [x] Hide settings while open; preserve saved status and failed-save errors on reopening.
- [x] Adapt regression tests for 320px, 390px and 1440px in both languages.
- [x] Check JavaScript syntax, static coverage and diff whitespace.
- [ ] Run the updated browser suite and inspect all six current screenshots.

Current (2026-09-28): UI and regression changes are ready for browser verification.
Blocked: Chrome launch aborts with SIGABRT inside the worker sandbox. No current
browser assertions have run, and existing screenshots are from the previous UI.
Next: Main runs the command below, then inspect `artifacts/consent-{fi,en}-{320,390,1440}.png`.
Fresh-banner height assertions are <=180px at 320px and <=150px at 390px/desktop.
Reopened status and storage errors remain visible and may increase banner height.
No commit, push or deployment is authorized for this task.

Historical verification of the prior modal UI (not evidence for the new layout):

Confirmed results after the transport-guard fix:
- PASS static coverage: all 53 FI/EN HTML pages use the shared consent gate.
- PASS fresh visit: no GA script, requests or GA cookies on all 53 pages.
- PASS FI/EN desktop and 320px mobile: fresh, reject, accept, reload and withdrawal.
- PASS keyboard focus wrapping in both directions, equal button styling and dialog viewport bounds.
- PASS cross-tab withdrawal and blocked storage failing closed.
- Visually inspected all four FI/EN desktop/mobile screenshots; copy and controls fit and match the site.
- PASS JavaScript syntax checks and `git diff --check`.

The full regression above uses the intercepted GA stub described below. Main also
confirmed PASS for the LOCAL real-Google diagnostic across FI/EN desktop/mobile:
local site files were served under the production hostname, the actual Google tag
was downloaded and executed after acceptance, and there were zero GA transport
calls after withdrawal. Analytics collection requests were fulfilled locally;
no measurement events were sent to Google. This verifies the fix locally with the
real Google runtime; the deployed fix still awaits main's live verification.
Screenshots and browser logs in `artifacts/` are ignored by Git and must not be committed.

```sh
PLAYWRIGHT_MODULE=/Users/jarvis/.npm/_npx/705bc6b22212b352/node_modules/playwright node tests/cookie-consent.cjs
```

With a regular local Playwright installation, `node tests/cookie-consent.cjs` suffices.
The default channel is Chrome; `PLAYWRIGHT_CHANNEL=chromium` selects bundled Chromium.
Static coverage only: add `--static`.

The suite routes the production hostname to this checkout, so the production-only
analytics guard is exercised without deploying. It checks all 53 pages fresh,
then FI/EN 1440px, 390px and 320px fresh/reject/accept/reload/withdraw flows,
no initial focus steal, keyboard exit in both directions, page interaction while open,
equal button styling, height/viewport bounds, cross-tab withdrawal and blocked
storage with persistent error messages on reopening. It writes screenshots into `artifacts/`.

Google requests are intercepted; a deterministic GA stub creates cookies and a
collection request after opt-in. This verifies the gate without sending test
traffic to Google. It does not verify Google's remote implementation.

Consent is stored in `localStorage` under `aigen.analytics-consent.v1`. Only the
exact value `accepted` permits GA. Missing, invalid or unreadable choices keep it
off. A session-only rejection is attempted if saving a withdrawal fails. Cookie
cleanup covers visible GA cookies on current/parent domains and current/ancestor
paths. Withdrawal sets the GA disable flag before cleanup and reload, which
unloads the existing Google runtime. Settings remain available on every page.

This worker has not committed or published changes. Main handles those actions separately.

Transport regression added after live diagnostics: the GA stub caches fetch,
sendBeacon and an already-open XHR send method while consent is accepted, then
invokes all three during pagehide even after rejection. The suite requires zero
new GA requests on withdrawal and verifies that the unload attempt occurred.
Separate probes verify that unrelated fetch/XHR/beacon requests and responses
retain their native behavior after rejection. Main confirmed all of these regression checks PASS, including unrelated transport behavior.
