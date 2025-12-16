---
"craft": patch
---

Add commitlint for conventional commits, enhance Redis handling, and improve AI provider management

**Features:**
- Add commitlint validation for conventional commit messages

**Fixes:**
- Resolve multi-instance deployment issues with Redis-backed distributed systems
- Migrate screenshot capture to separate E2B template
- Update YAML parsing to use js-yaml 4.x
- Update pnpm lockfile to match package.json overrides
- Remove [skip ci] from auto-changeset to trigger releases
- Remove type-enum rule from commitlint configuration

**Improvements:**
- Implement unified AI provider registry for improved provider management
- Enhance Redis handling and error tracking across components
- Update dependencies and documentation for Next.js 16 integration
- Refactor code structure for improved readability and maintainability
