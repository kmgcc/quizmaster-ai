# Utils Module

## OVERVIEW

Shared utilities - backup/export, theme system, sanitization, code highlighting.

## STRUCTURE

```
utils/
├── backup.ts            # ~320 lines - localStorage backup/import/export
├── theme.ts             # ~800 lines - Theme palette system
├── sanitizeText.ts      # ~100 lines - Text sanitization
└── codeHighlighter.tsx  # ~150 lines - Code syntax highlighting
```

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Data backup/export | `backup.ts` | BackupV1 format, import/export |
| Theme management | `theme.ts` | Color palettes, dark mode |
| Text sanitization | `sanitizeText.ts` | Input cleaning, XSS prevention |
| Code highlighting | `codeHighlighter.tsx` | Syntax highlight for code blocks |

## CONVENTIONS

- **Pure functions only**: No React components (except codeHighlighter.tsx)
- **Named exports**: All functions exported individually
- **Type safety**: Full TypeScript, no `any` or `as`
- **No dependencies**: Utils don't import from components/services

## ANTI-PATTERNS

- **DO NOT add React state**: Utils are pure, state in App.tsx
- **AVOID external dependencies**: Use native APIs when possible
- **NEVER suppress types**: No `@ts-ignore`, `as any`

## NOTES

- **theme.ts is large**: 800+ lines for color palettes - consider splitting
- **BackupV1 format**: Defined in backup.ts, used for data export
- **CDN highlighting**: codeHighlighter uses CDN libraries, not npm packages
