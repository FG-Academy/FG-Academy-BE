# FG-ACADEMY-BE

**Generated:** 2026-01-02 | **Commit:** 40a9b84 | **Branch:** refactor/overall

## OVERVIEW

NestJS LMS backend (courses, quizzes, user progress tracking). MySQL + TypeORM. JWT auth with role-based access.

## STRUCTURE

```
src/
├── api/           # Feature modules (admin, auth, users, courses, etc.)
│   ├── admin/     # ⚠️ God service - handles ALL admin operations
│   └── auth/      # JWT + Kakao OAuth, guards, strategies
├── entities/      # 12 TypeORM entities (centralized, not per-module)
├── common/s3/     # AWS S3 upload utilities
├── config/        # TypeORM + data-source (dual config for CLI)
└── filter/        # Global exception filter (NOT registered)
```

## WHERE TO LOOK

| Task             | Location                            | Notes                                         |
| ---------------- | ----------------------------------- | --------------------------------------------- |
| Add API endpoint | `src/api/{module}/`                 | Follow controller → service → dto pattern     |
| Add entity       | `src/entities/`                     | Update `typeorm.config.ts` entities array     |
| Auth/guards      | `src/api/auth/guards/`              | `@Public()` bypasses JWT, `@Roles()` for RBAC |
| Admin features   | `src/api/admin/admin.service.ts`    | ⚠️ 1200+ line monolith                        |
| S3 uploads       | `src/common/s3/`, `src/api/upload/` | Presigned URL pattern                         |
| Migrations       | `src/database/migrations/`          | `pnpm migration:generate`                     |

## CONVENTIONS

**Deviations from NestJS defaults:**

- Entities centralized in `src/entities/` (not per-module)
- API prefix: `/api/v1` (set globally)
- Validation errors return **422** (not 400)
- `TZ=Asia/Seoul` required in all start scripts
- `strictNullChecks: false`, `noImplicitAny: false` — permissive TypeScript

**Formatting:**

- Single quotes, trailing commas (`prettier`)
- Use `src/` path aliases (not relative `../../../`)

## ANTI-PATTERNS

| Forbidden                    | Reason                                              |
| ---------------------------- | --------------------------------------------------- |
| Adding to `AdminService`     | Already 1200+ lines; create domain-specific service |
| Entity in module folder      | Keep all entities in `src/entities/`                |
| Direct TypeORM in controller | Always use service layer                            |
| Hardcoded timezone           | Use `TZ` env var from start scripts                 |

## COMMANDS

```bash
pnpm start:dev          # Dev server (port 8080)
pnpm build              # Production build
pnpm migration:generate # Generate migration
pnpm migration:run      # Run migrations
pnpm test               # Unit tests
pnpm test:e2e           # E2E tests
```

## NOTES

- **GlobalExceptionFilter exists but is NOT registered** — error handling may be inconsistent
- **RefreshTokenIdsStorage** uses DB; Redis integration commented out
- **useContainer** enables DI in class-validator (see `IsUserAlreadyExist`)
- Nginx routes `/api/v1` to this backend; frontend is separate Next.js app
- Docker multi-stage build; deploys to EC2 via GitHub Actions → ECR
