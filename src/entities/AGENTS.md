# ENTITIES

## OVERVIEW

12 TypeORM entities for LMS domain. Centralized (not per-module).

## DOMAIN MODEL

```
Category ─────┐
              ▼
           Course ──────┬──► Lecture ──────┬──► Quiz ──► QuizAnswer
              │         │        │         │       │
              │         │        ▼         │       ▼
              │         │  LectureTimeRecord    QuizSubmit
              │         │        ▲              ▲
              │         ▼        │              │
              └──► Enrollment ◄──┴──────────────┘
                       │
User ─────────────────┬┘
      │               │
      ▼               ▼
   Question ──► Answer
```

## ENTITY MAP

| Entity            | Key Relations                                   | Purpose                |
| ----------------- | ----------------------------------------------- | ---------------------- |
| User              | → Enrollment, QuizSubmit, LectureTimeRecord     | Student/admin accounts |
| Course            | ← Category, → Lecture, Enrollment, Announcement | Main content container |
| Lecture           | ← Course, → Quiz, LectureTimeRecord             | Video/content unit     |
| Quiz              | ← Lecture, → QuizAnswer, QuizSubmit             | Assessment             |
| Enrollment        | ← User, Course                                  | Course registration    |
| LectureTimeRecord | ← User, Lecture                                 | Watch progress         |
| QuizSubmit        | ← User, Quiz                                    | Quiz attempts          |
| Question/Answer   | ← User                                          | Community Q&A          |

## CONVENTIONS

- All entities use `@CreateDateColumn`, `@UpdateDateColumn`
- Password hashing: `@BeforeInsert` hook in User entity
- Soft delete: Not used (hard delete only)
- IDs: Auto-increment integers

## ANTI-PATTERNS

| Forbidden                | Reason                                              |
| ------------------------ | --------------------------------------------------- |
| Entity in module folder  | Keep centralized here                               |
| Business logic in entity | Only hooks for data integrity (e.g., password hash) |
| Skip relation decorators | Always define both sides of relation                |

## NOTES

- `Quiz.quizType`: 'objective' | 'descriptive'
- `User.level`: Role field ('L0' = standard, 'admin' = administrator)
- `Enrollment.completedLectures`: JSON array of completed lecture IDs
