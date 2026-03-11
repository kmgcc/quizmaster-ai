# Components Module

## OVERVIEW

Feature components for QuizMaster AI - quiz UI, bank management, AI chat integration.

## STRUCTURE

```
components/
├── BankManager.tsx      # ~2100 lines - Question bank import/export/management
├── QuizRunner.tsx       # ~650 lines - Quiz session interface
├── QuizReviewer.tsx     # ~1000 lines - Results review, notes, AI chat
├── QuestionRenderer.tsx # ~360 lines - Markdown question rendering
├── ChatDrawer.tsx       # ~750 lines - AI chat drawer component
├── TestRunner.tsx       # ~100 lines - Test component (minimal)
└── ui/
    └── GlowSurface.tsx  # UI primitive with glow effects
```

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Bank import/export | `BankManager.tsx` | JSON parsing, validation, folder management |
| Quiz flow UI | `QuizRunner.tsx` | Question display, answer selection, feedback |
| Results review | `QuizReviewer.tsx` | Score display, notes, AI chat integration |
| Markdown rendering | `QuestionRenderer.tsx` | react-markdown, code highlighting |
| AI chat drawer | `ChatDrawer.tsx` | Streaming chat, message history |
| UI primitives | `ui/GlowSurface.tsx` | Themed surface with glow effects |

## CONVENTIONS

- **Feature components only**: No pure UI components (no Button, Input, etc.)
- **Props interface**: Defined inline with component, not separate types file
- **Direct imports**: Import from parent types.ts, not re-exports
- **State lifting**: All state managed in App.tsx, passed as props

## ANTI-PATTERNS

- **DO NOT add react-router**: State-based routing is intentional
- **AVOID adding pure UI components**: Use CDN Tailwind utilities instead
- **DO NOT create context providers**: Centralized state in App.tsx

## NOTES

- **BankManager.tsx.bak**: Backup file present - cleanup candidate
- **Large components**: BankManager (2100+ lines) - consider splitting if adding features
- **No test files**: No .test.tsx or .spec.tsx files present
