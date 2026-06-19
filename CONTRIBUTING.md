# Contributing to BanglaClip

## Project State
BanglaClip is currently a solo-maintained project in rapid development. While we aim for stability, we prioritize feature delivery and responsiveness. We welcome community contributions and follow a standard Git-flow-inspired workflow to maintain code quality as we grow.

## Branch Strategy

We use two primary branches:
- `main`: **Stable, production-ready releases only.** This branch is tagged with version numbers.
- `dev`: **Integration branch.** All new features and bug fixes must be merged here first before moving to `main`.

### Working on a Change
1. **Fork** the repository and clone it locally.
2. **Create a branch** from `dev`:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** and follow the commit conventions below.
4. **Push and PR**: Push your branch to your fork and open a Pull Request against the `dev` branch of the original repository.

> **Note:** Direct commits to `main` are restricted to critical hotfixes and release tagging by maintainers.

---

## Commit Convention

We follow a simplified [Conventional Commits](https://www.conventionalcommits.org/) pattern:
`type(scope): short description`

| Type | Description |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `chore` | Tooling, dependencies, or refactors with no logic change |
| `docs` | Documentation changes |
| `test` | Adding or correcting tests |
| `perf` | Performance improvements |

### Examples
- `feat(pipeline): add real Pexels b-roll overlay`
- `fix(jobs): handle 401 errors in YouTube upload`
- `docs(env): document Forge API requirements`

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
