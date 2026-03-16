# Contributing to FunMap

## Branching Strategy

```
main        — stable, production-ready (protected)
  └── develop   — integration branch (all features merge here first)
        └── feat/phase-1-init
        └── feat/phase-4-auth
        └── feat/phase-7-heatmap
        ...
```

- `main` is protected: requires a PR review before merging
- `develop` is where active development happens
- Each feature/phase gets its own branch off `develop`

## Workflow for Each Phase

```bash
# 1. Make sure develop is up to date
git checkout develop
git pull origin develop

# 2. Create a feature branch
git checkout -b feat/phase-X-description

# 3. Do the work, commit as you go
git add src/components/map/FunToggle.tsx
git commit -m "feat: add pill-shaped fun toggle component"

# 4. Push the branch
git push -u origin feat/phase-X-description

# 5. Open a PR on GitHub
gh pr create --base develop --title "Phase X: description" --body "..."

# 6. The other person reviews and merges
```

## Commit Message Convention

```
feat: add realtime heatmap
fix: toggle not persisting after app restart
chore: update dependencies
docs: add testing guide
refactor: extract clustering logic into utils
```

## Setting Up Locally

1. Clone the repo: `git clone https://github.com/gilfe555/funmap.git`
2. Follow [docs/SETUP.md](docs/SETUP.md) for environment setup
3. Set up Supabase: [docs/SUPABASE.md](docs/SUPABASE.md)
4. Set up Google Maps: [docs/GOOGLE_MAPS.md](docs/GOOGLE_MAPS.md)
5. Copy `.env.example` to `.env` and fill in your keys (ask Gil for the values via a secure channel)
6. Run `npm install` then `npx expo start`

## PR Checklist

Before opening a PR, make sure:

- [ ] The feature works on Android Emulator (Pixel_8)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No console errors during normal usage
- [ ] New environment variables are added to `.env.example` (not `.env`)
- [ ] Any new setup steps are documented in the relevant `docs/` file

## Questions?

Open a GitHub issue or message in the group chat.
