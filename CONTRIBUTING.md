# Contributing

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env`
4. Run tests: `npm test`

## Code Standards

- TypeScript strict mode
- ESLint + Prettier enforced
- Conventional commits (enforced by commitlint)
- All PRs must pass CI

## Commit Format

```
type(scope): description

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert, security
```

## Pull Request Process

1. Create a feature branch from `main`
2. Write tests for new functionality
3. Ensure all tests pass and coverage >= 90%
4. Update documentation if needed
5. Submit PR with clear description

## Security

If you discover a security vulnerability, please see [SECURITY.md](SECURITY.md) for responsible disclosure procedures. Do not open a public issue.
