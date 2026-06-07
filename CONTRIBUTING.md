# Contributing to BanglaClip

## Branch Rules

### Branch Structure

```
main        ← stable, production-ready releases only
└── dev     ← integration branch, all work lands here first
    ├── feature/your-feature-name
    ├── fix/bug-description
    └── chore/what-you-are-doing
```

### Rules

| Branch | Who pushes | When |
|---|---|---|
| `main` | Merge from `dev` only | When a version is tested and ready to release |
| `dev` | Feature/fix branches merge here | After local testing passes |
| `feature/*` | You | New features |
| `fix/*` | You | Bug fixes |
| `chore/*` | You | Refactors, deps, docs, tooling |

**Never commit directly to `main`.** Always go through `dev` first.

---

## Commit Convention

Format: `type(scope): short description`

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Refactor, deps, tooling, no logic change |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `test` | Adding or fixing tests |
| `perf` | Performance improvement |

### Examples

```
feat(pipeline): add real Pexels b-roll overlay
fix(jobs): reset stage status correctly on retry
chore(deps): update drizzle-orm to 0.45
docs(readme): add environment variable reference
```

---

## Release Process

1. All features for the release are merged into `dev`
2. `dev` is tested end-to-end
3. `dev` is merged into `main` via PR
4. A version tag is created on `main`:

```bash
git tag -a v1.x.0 -m "BanglaClip v1.x.0 — short description"
git push origin v1.x.0
```

5. A GitHub Release is created from the tag with full changelog notes

---

## Version Numbering (SemVer)

`MAJOR.MINOR.PATCH`

- **MAJOR** — breaking change or full redesign
- **MINOR** — new features, backward compatible
- **PATCH** — bug fixes, small tweaks

Current version: see [CHANGELOG.md](CHANGELOG.md)
