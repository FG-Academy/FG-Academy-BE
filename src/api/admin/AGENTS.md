# ADMIN MODULE

## OVERVIEW

Administrative operations for LMS management. **⚠️ God service pattern — AdminService handles everything.**

## STRUCTURE

```
admin/
├── admin.controller.ts   # All admin endpoints
├── admin.service.ts      # ⚠️ 1200+ lines - monolithic
├── dto/                  # Request/response DTOs
└── type/                 # Internal type definitions
```

## WHERE TO LOOK

| Task             | Location                                          |
| ---------------- | ------------------------------------------------- |
| User management  | `admin.service.ts` → `findAllUsers`, `updateUser` |
| Course CRUD      | `admin.service.ts` → `createCourse`, `copyCourse` |
| Feedback/grading | `admin.service.ts` → `feedbackDescriptiveQuiz`    |
| Category ops     | `admin.service.ts` → `updateCategory`             |

## CONVENTIONS

- All endpoints require `@Roles('admin')` guard
- Uses QueryRunner for transactions (manual, not decorator-based)
- Label mapping (e.g., `departmentName` → `departmentLabel`) done in service

## ANTI-PATTERNS

| Forbidden                             | Do Instead                                                   |
| ------------------------------------- | ------------------------------------------------------------ |
| Add more methods to AdminService      | Create domain-specific service (e.g., `AdminCoursesService`) |
| Skip transaction for multi-entity ops | Always use QueryRunner pattern                               |
| Return raw entity                     | Map to DTO with explicit fields                              |

## NOTES

- Handles: users, courses, lectures, quizzes, categories, feedback
- Complex copy logic in `copyCourse` — duplicates course with all relations
- Excel export capability via `exceljs`
