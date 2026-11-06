# Daily content and release workflow

## Public code, private content

The code and artwork are public. The unreleased question bank lives in `private/bank.json`, which is ignored by Git and excluded from the hosting build. Vercel receives a compressed copy in the server-only `BALLPARK_BANK_GZIP_BASE64` environment variable. This avoids adding a paid database for the initial reserve. Do not put content in a `PUBLIC_*`, `VITE_*` or `NEXT_PUBLIC_*` variable.

The five original demo questions remain public and are served only as explicitly labeled practice when no approved set is scheduled. Missing coverage never reuses a published daily puzzle and never invents a question at runtime.

## Editorial flow

1. Research a reserve of historical numerical facts using league, team, school, NCAA, or Hall of Fame sources.
2. Store each candidate's exact scope, positive numeric answer, units, source URL, dated verification note and canonical `factId`.
3. `npm run content:check` validates the bank. `npm run content:review` prepares a private review table.
4. The owner reviews the candidate text, difficulty and answers. Do not approve on the owner's behalf.
5. After explicit approval, run `node scripts/content.mjs approve --reviewed-hash HASH --start YYYY-MM-DD --reviewer NAME` for the initial 14-day reserve. This records approval, assigns one question per sport per day, and reserves every underlying fact in the permanent ledger.
6. `node scripts/content.mjs pack` writes `private/bank.env`. Set its value directly in Vercel project environment settings for production, then deploy the reviewed code. Never print the bank value or commit that file.
7. Review and replenish future sets before the reserve falls below seven days. Automated drafting can be added later; this version does not call an AI provider, incur model fees, or automatically approve content.

Drafts, verification and approval are distinct statuses. Only `approved` questions can be scheduled. Never change an already published set or erase its fact ledger. A rephrased question must reuse the same fact ID and is therefore blocked from scheduling again. Human review remains necessary to recognize paraphrases with incorrectly assigned new IDs.

## Daily behavior

The server picks the current date with the `America/Chicago` timezone, including DST, and shuffles the approved five using that date. Everyone receives the same questions and order. There is no midnight build or scheduled job to miss. Each new session uses the server's current date; a game already underway remains pinned to its original puzzle across midnight. Responses are private/no-store, so caches cannot pin yesterday's puzzle.

`GET /api/daily` provides a date, puzzle ID, mode and signed session token, but no question text. `POST /api/question` reveals only the token's current question, without its answer or source. `POST /api/score` returns that question's answer/source after submission and issues the next-round token. Tokens expire after 36 hours and cannot be modified to select an arbitrary future date or round. The client saves guest progress in its own browser and handles interrupted scoring with an identical retry.

## Guest-play limits

This first release has no accounts, leaderboard or server-side attempt database. Signed tokens enforce the question sequence and prevent altered dates/round numbers, but a technically determined player can replay an old token or start a new anonymous session. The normal daily UI offers one attempt and no replay button after completion. This is suitable for the initial casual guest release, not competitive anti-cheat enforcement. Future competitive features need durable attempt storage.

## Deployment checks

Run unit tests, build the public site and verify it contains no private files. Browser checks should cover the served API flow as well as the standalone practice export: question secrecy, score reveals, reload/resume, timeouts, invalid inputs, network retry, completed daily sessions, Chicago rollover and reduced motion. Git-based Vercel deployment is used; no scheduled generation or midnight deployment is required.
