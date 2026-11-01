# Royal Wedding scroll verification

Verified locally on 1 November 2026. The production build and TypeScript checks passed. The focused opening, invitation, date, events, Explore, scrolling, and RSVP suites covered 43 checks; the two initial mobile spacing failures passed after increasing submit-area clearance.

## Optimized-build performance comparison

Chrome headless, 390 × 844 viewport, identical scripted 2.4-second event-section scroll, three runs per CPU setting. Values below are medians. Both versions used the same local production server setup; builds and browser tests were stopped during profiling.

| Measurement | Before | After |
| --- | ---: | ---: |
| Normal CPU: p95 frame interval | 7.1 ms | 7.1 ms |
| Normal CPU: script duration | 140 ms | 92 ms |
| Normal CPU: style recalculation | 115 ms | 90 ms |
| 4× CPU slowdown: p95 frame interval | 14.0 ms | 14.0 ms |
| 4× CPU slowdown: script duration | 404 ms | 384 ms |
| 4× CPU slowdown: style recalculation | 316 ms | 353 ms |

No long tasks were recorded in these measured windows. Script duration fell approximately 34% at normal CPU and 5% under throttling. Throttled style recalculation increased approximately 12%, while the measured p95 frame interval stayed unchanged. These synthetic measurements do not establish performance on every phone.

An intermediate implementation regressed under throttling. Browser diagnostics isolated the large animated progress fill behind ceremony navigation. Replacing it with a thin composited progress line restored the previous frame timing while preserving navigation and the active gold indicator.

The read-only profiling script is `scripts/profile-royal-scroll.mjs`. Raw local results are in ignored `work/scroll-ux/before.json` and `work/scroll-ux/after-final.json`.

## Limits

Desktop Chrome and emulated mobile layouts were checked. Physical Android Chrome and iPhone Safari toolbar behavior still requires device testing. No VPS deployment was performed as part of this verification.
