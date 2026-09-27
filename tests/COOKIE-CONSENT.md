# Cookie consent verification

Task: Aigen.fi consent gate
Goal: GA starts only after explicit acceptance across FI/EN pages.

- [x] Replace all 53 HTML loaders and both blog-generator loaders.
- [x] Add shared FI/EN consent UI, saved choice and settings button.
- [x] Disable GA, remove first-party GA cookies and reload on withdrawal.
- [x] Check JavaScript syntax, HTML coverage and diff whitespace.
- [x] Run Playwright browser checks and inspect screenshots.

Current: Main exec verified the transport-guard fix on 2026-09-27. The full expanded stub regression and LOCAL real-Google diagnostic both pass for FI/EN desktop and mobile.
Blocked: None. Main exec ran the browser suite because the worker sandbox prevents browser launch.
Next: Main handles publishing the fix and verifying the deployed site. Worker changes are paused.

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
then FI/EN desktop and 320px mobile fresh/reject/accept/reload/withdraw flows,
keyboard focus, equal button styling, dialog viewport bounds, cross-tab withdrawal
and blocked storage. It writes screenshots into `artifacts/`.

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
