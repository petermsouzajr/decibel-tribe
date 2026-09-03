# Dating Tribe — Migration Plan  
## From Next.js web UI → single Expo product (mobile + subdomain web)

**Status:** Approved direction (planning doc)  
**Owner:** Pete  
**Last updated:** 2026-08-24  

**Related repos**
| Repo | Role after migration |
|------|----------------------|
| `petermsouzajr/decibel-tribe` | Social web app + **dating API/DB only** |
| `petermsouzajr/datingtribe` | **Only** dating product UI (iOS, Android, web) |
| `dating-shared` (local / optional package) | Shared types/hooks — not a second UI |

**Related docs (existing, do not contradict without updating this file)**
- `datingtribe` → `build_plan/*` (how Expo was ported from Next components)
- `datingtribe` → App Store / TestFlight checklists
- Hermes → `docs/datingtribe-testflight-safe-deploy.md` (store ship pipeline)
- Legacy: `docs/archive/DATING_MASTER_PLAN.md` said “no native app” — **superseded for UI** by this plan. API/backend guidance in that doc may still apply.

---

## 1. Goal (one sentence)

**Maintain one dating UI in Expo.** Serve it on the App Store / Play Store **and** at a subdomain (e.g. `dating.decibeltribe.com`). Keep **decibel-tribe** as the social site and the only backend. Stop maintaining the Next.js dating pages as a full product.

---

## 2. Why

| Today (problem) | Target (solution) |
|-----------------|-------------------|
| Full dating UI in Next (`decibel-tribe`) | Dating UI only in Expo (`datingtribe`) |
| Full dating UI again in Expo | Same Expo app → native + web |
| Two frontends to feature-fix | One frontend to feature-fix |
| One API/DB (already good) | Keep one API/DB in decibel |

**decibel-tribe does not become a mobile app.** It stays Next.js on Vercel for the musicians social network + `/api/*`.

---

## 3. Target architecture

```
                    ┌─────────────────────────────────┐
                    │  dating.decibeltribe.com         │
                    │  (Expo web export / hosting)     │
                    └───────────────┬─────────────────┘
                                    │
┌───────────────────┐               │  HTTPS API
│ App Store / Play  │               │
│ Dating Tribe      │───────────────┤
│ (Expo native)     │               │
└───────────────────┘               ▼
                    ┌─────────────────────────────────┐
                    │  decibel-tribe (Next.js)         │
                    │  • Social web (feed, groups, …)  │
                    │  • /api/dating/*  (KEEP)         │
                    │  • Prisma + PostgreSQL (KEEP)    │
                    │  • /dating → redirect to subdomain│
                    └─────────────────────────────────┘
```

**Repos:** stay **separate**.  
**Optional later:** monorepo only if shared-package + CI pain justifies it — not required for this migration.

---

## 4. Non-goals

- Migrating all of Decibel Tribe social into Expo  
- Rewriting the API in a new service  
- Merging git histories of the two repos  
- Deleting the database or dating tables  
- Same-day App Store submit without TestFlight  

---

## 5. What stays / what goes

### Keep forever (decibel-tribe)
- All `/api/dating/*` routes  
- Prisma models related to dating (profiles, swipes, matches, prefs, photos, etc.)  
- Auth that the mobile/web clients use  
- Stream / UploadThing server-side config as today  
- Social product UI (non-dating)

### Freeze immediately (decibel-tribe)
- New features on `src/app/(main)/dating/**`  
- New features on `src/components/dating/**` (except critical prod hotfixes)  
- Cypress/e2e expansion for Next dating UI (prefer Expo QA next)

### Retire after Expo parity (decibel-tribe)
- Next dating **pages** and **client components** that duplicate Expo screens  
- Replace entry points with redirect/link to subdomain  

### Single product UI (datingtribe)
- All dating screens, navigation, gestures, push, camera, location  
- Expo web build for subdomain  
- EAS / TestFlight / store releases  

---

## 6. Phases

### Phase 0 — Align (1 sitting)
- [x] Decision: one Expo UI + subdomain web + decibel API  
- [ ] Share this doc with anyone who touches either repo  
- [ ] Confirm production API base URL and final subdomain name  
  - Proposed web: `https://dating.decibeltribe.com`  
  - Proposed API: existing production host (e.g. `https://decibel-tribe.com` or `https://www.decibeltribe.com` — **pick one canonical**)

**Exit:** subdomain name + API base locked.

---

### Phase 1 — Freeze Next dating UI
- [ ] Comment in PR template / README: “Dating UI changes go in `datingtribe` only”  
- [ ] Optional: add short banner on Next `/dating` — “Dating is moving to the app / new web experience”  
- [ ] Stop non-critical commits to Next dating UI  

**Exit:** team (you + agents) only ship dating UX in Expo.

---

### Phase 2 — Expo product completeness (against real API)
Build/fix in `datingtribe` only. Minimum lovable product:

| Flow | Done? |
|------|--------|
| Sign up / log in (same accounts as decibel) | [ ] |
| Dating onboarding | [ ] |
| Deck + like/dislike | [ ] |
| Matches list | [ ] |
| Chat (Stream) | [ ] |
| Profile + photos | [ ] |
| Preferences / filters | [ ] |
| Likes you / history (if still product requirements) | [ ] |
| Report / block | [ ] |
| Push notifications (native) | [ ] |

Config:
- [ ] `EXPO_PUBLIC_API_URL` → production (and a staging value for dev)  
- [ ] CORS / cookies / auth headers work for **native** and **web** origins  
- [ ] No reliance on Next-only session quirks without a mobile-safe path  

**Exit:** you can complete core loops on a device (Expo Go or dev build) against prod or staging API.

---

### Phase 3 — Expo web + subdomain
- [ ] Verify `npx expo export -p web` (or current Expo web pipeline) produces a usable dating web app  
- [ ] Note web gaps (swipe gestures, camera, push) — document “mobile-only” vs “web-supported”  
- [ ] Host web build:
  - Option A: EAS Hosting  
  - Option B: static/export on Vercel project `dating-tribe-web`  
  - Option C: other CDN — fine if HTTPS + custom domain work  
- [ ] DNS: `dating.decibeltribe.com` (or chosen name) → hosting  
- [ ] TLS certificate green  
- [ ] Set web origin in API CORS allowlist  
- [ ] Smoke test: login → deck → match → chat in desktop + mobile browser  

**Exit:** public URL serves Expo web dating UI talking to decibel API.

---

### Phase 4 — Wire decibel main site
- [ ] Nav item “Dating” → subdomain (new tab or same tab)  
- [ ] `src/app/(main)/dating/**` routes: **301/302 redirect** to subdomain (preserve path when possible, e.g. `/dating/matches` → `https://dating…/matches` if routes align; else redirect home of dating app)  
- [ ] Deep links from social profiles (“Open in Dating”) point at subdomain or app scheme  
- [ ] Update any public docs / README architecture diagram  

**Exit:** users hitting old Next dating URLs land on Expo web (or app store badges).

---

### Phase 5 — Stores
- [ ] EAS project ID real (not placeholders)  
- [ ] `eas.json` Apple/Google IDs real (not template)  
- [ ] Privacy policy + support URLs (can live on decibel domain)  
- [ ] Internal / TestFlight build  
- [ ] Pete manual QA checklist  
- [ ] Production submit when you explicitly ship  

Follow: Hermes `datingtribe-testflight-safe-deploy.md` + in-repo store checklists.  
**Ship gate:** automated checks green + Pete manual verify + explicit “ship it”.

**Exit:** TestFlight (then store) available; web subdomain already live.

---

### Phase 6 — Remove legacy Next dating UI
Only after Phase 3–4 are stable for real users (or you accept web-only on subdomain).

- [ ] Delete or gut `src/components/dating/**` client UI not used by API  
- [ ] Keep any server-only helpers still needed by `/api/dating/*`  
- [ ] Remove or rewrite Cypress dating UI specs; add API tests / Expo QA instead  
- [ ] Leave redirects in place (or middleware) so old bookmarks work  
- [ ] Update `archive/DATING_FEATURE_COMPLETE.md` / master plan status to “UI owned by datingtribe”  

**Exit:** decibel repo has **no second dating frontend**; API + redirects only.

---

### Phase 7 — Optional hardening
- [ ] Publish or monorepo `dating-shared` (types/hooks) so Expo + API stay aligned  
- [ ] Universal links / app links: `dating.decibeltribe.com` → opens native app when installed  
- [ ] Staging subdomain + staging API  
- [ ] Feature flags if web must hide weak flows  

---

## 7. Suggested subdomain & URL map

| Surface | URL |
|---------|-----|
| Social web | `https://decibeltribe.com` (or current production host) |
| Dating web (Expo) | `https://dating.decibeltribe.com` |
| Dating API | `https://<decibel-host>/api/dating/...` |
| Old dating paths | `https://<decibel-host>/dating/*` → redirect to Expo web |

Path mapping (adjust when Expo routes are final):

| Old Next path | New (Expo web) |
|---------------|----------------|
| `/dating` | `https://dating.decibeltribe.com/` |
| `/dating/matches` | `.../matches` (or app route equivalent) |
| `/dating/profile` | `.../profile` |
| `/dating/onboarding` | `.../onboarding` |

If paths differ, redirect all `/dating/*` → Expo root and handle in-app routing.

---

## 8. Auth & API checklist (do not skip)

- [ ] Session/token strategy works for:
  - Native (secure store)  
  - Expo web (cookies or bearer — pick one and document)  
- [ ] CORS allows `https://dating.decibeltribe.com`  
- [ ] CSRF / cookie `SameSite` settings still correct for subdomain split  
- [ ] Google OAuth redirect URIs include Expo web + native schemes if used  
- [ ] Rate limits and verification rules unchanged server-side  

---

## 9. Risk register

| Risk | Mitigation |
|------|------------|
| Expo web UX worse than Next on desktop | Ship mobile-first web; keep “Get the app” prominent; fix only critical web bugs |
| Auth breaks across subdomain | Solve in Phase 2–3 before deleting Next UI |
| Accidental feature work on Next dating | Phase 1 freeze + this doc |
| Store review delay | Web subdomain can launch first |
| Two codebases still for “shared constants” | Optional `dating-shared`; API is source of truth for behavior |
| SEO for `/dating` | Redirects + optional landing blurb on decibel |

---

## 10. Definition of done (whole program)

1. Dating features are implemented **once**, in `datingtribe`.  
2. iOS (and Android if in scope) installable via TestFlight/store path you chose.  
3. `dating.<domain>` serves Expo web against production API.  
4. decibel `/dating` redirects; no parallel Next dating feature work.  
5. `/api/dating/*` remains on decibel and is the only backend.  
6. Pete has manually verified critical paths and approved any production store submit.

---

## 11. Immediate next actions (start here)

1. Lock subdomain + canonical API host names (write them at the top of this file under Phase 0).  
2. Freeze Next dating UI.  
3. Gap-check Expo vs Next flows (checklist in Phase 2).  
4. Stand up Expo web on the subdomain.  
5. Redirect `/dating` → subdomain.  
6. TestFlight when mobile is ready.  
7. Delete legacy Next dating UI last.

---

## 12. Document control

| Location | Purpose |
|----------|---------|
| `decibel-tribe/docs/DATING_EXPO_MIGRATION_PLAN.md` | Canonical plan next to backend/web |
| `datingtribe/docs/DATING_EXPO_MIGRATION_PLAN.md` | Same plan for mobile repo |
| Hermes `docs/DATING_EXPO_MIGRATION_PLAN.md` | Agent reference (optional sync) |

**Commits:** add this file via normal PR when you want it on GitHub; creating the file does not by itself change production.

When direction changes, update **this** doc first, then code.
