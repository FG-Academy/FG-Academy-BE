# AUTH MODULE

## OVERVIEW

JWT authentication with dual-token pattern (access + refresh). Role-based access control.

## STRUCTURE

```
auth/
├── strategies/
│   ├── jwt.strategy.ts          # Bearer token from header
│   ├── jwtRefresh.strategy.ts   # Refresh token from cookie
│   └── local.strategy.ts        # Username/password
├── guards/
│   ├── jwtAuth.guard.ts         # Main auth guard (respects @Public)
│   ├── jwtRefreshAuth.guard.ts  # Refresh endpoint guard
│   ├── roles.guard.ts           # RBAC via @Roles decorator
│   └── localAuth.guard.ts       # Login endpoint
├── decorators/
│   └── public.decorator.ts      # @Public() bypasses JWT
├── interceptors/
│   └── token.interceptor.ts     # Sets refresh token cookie
└── refreshTokenIdsStorage.ts    # DB-based token storage
```

## WHERE TO LOOK

| Task                 | Location                                                  |
| -------------------- | --------------------------------------------------------- |
| Make route public    | Add `@Public()` decorator                                 |
| Add role restriction | Add `@Roles('admin')` decorator                           |
| Modify JWT payload   | `jwt.strategy.ts`, `jwtPayload.interface.ts`              |
| Change token expiry  | `auth.service.ts` → `signAccessToken`, `signRefreshToken` |
| Token storage        | `refreshTokenIdsStorage.ts` (DB-based, Redis commented)   |

## CONVENTIONS

- Access token: 1 hour, in response body
- Refresh token: 30 days, HTTP-only cookie (`refreshToken`)
- Role field: `user.level` (e.g., 'L0', 'admin')
- Public routes: Use `@Public()`, not route-level guard removal

## ANTI-PATTERNS

| Forbidden                        | Do Instead                              |
| -------------------------------- | --------------------------------------- |
| Extract token manually           | Use appropriate strategy/guard          |
| Store sensitive data in JWT      | Keep payload minimal (sub, name, email) |
| Skip `@Public()` for open routes | Always explicit — guard is global       |

## NOTES

- `JwtAuthGuard` is applied globally via `APP_GUARD`
- `verifyPayload` does DB lookup — confirms user still exists
- Cookie settings: `httpOnly: true`, `sameSite: 'lax'`, `secure` in prod
