# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-10
**Branch:** main

## OVERVIEW

QuizMaster AI - React 19 + Vite 6 SPA for quiz/exam practice with AI tutoring. TypeScript, Tailwind CSS, localStorage persistence.

## STRUCTURE

```
quizmaster-ai/
├── index.tsx              # App entry point (no src/ - files at root)
├── App.tsx                # Main orchestrator (875 lines, state-based routing)
├── types.ts               # TypeScript interfaces
├── constants.ts           # Sample data, AI grader instructions
├── vite.config.ts         # Vite + PWA config
├── index.html             # HTML entry (CDN Tailwind, import maps)
├── components/            # React components (6 .tsx files)
├── services/              # API clients, AI services, validators
├── utils/                 # Utilities (backup, theme, sanitization)
├── hooks/                 # Custom hooks (useGlowManager)
├── dist/                  # Build output (committed for GH Pages)
└── dev-dist/              # PWA service workers (dev)
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add UI component | `components/` | Feature components, not pure UI |
| Add API service | `services/` | AI client, grading, validation |
| Add utility function | `utils/` | Helpers, theme, backup logic |
| Modify types | `types.ts` | All TypeScript interfaces |
| Change app logic | `App.tsx` | State management, routing, persistence |
| PWA config | `vite.config.ts` | Service worker, manifest |
| Build/deploy | `.github/workflows/deploy.yml` | GH Pages automation |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `App` | Component | App.tsx:13 | Main orchestrator, state management |
| `QuestionBank` | Interface | types.ts:38 | Quiz data structure (v1/v2 schema) |
| `QuizRunner` | Component | components/QuizRunner.tsx | Quiz session UI |
| `QuizReviewer` | Component | components/QuizReviewer.tsx | Results review, notes, AI chat |
| `BankManager` | Component | components/BankManager.tsx | Question bank import/management |
| `aiClient` | Module | services/aiClient.ts | Streaming AI chat client |
| `geminiService` | Module | services/geminiService.ts | Google AI service |
| `backup` | Module | utils/backup.ts | localStorage export/import |
| `theme` | Module | utils/theme.ts | Theme palette system |

## CONVENTIONS

- **No src/ directory**: App files live at root level
- **State-based routing**: `view` state in App.tsx ('home' | 'quiz' | 'review' | 'tests')
- **localStorage persistence**: All data in browser storage with `qb_` prefix
- **Schema v2 preferred**: Question banks support v1 and v2 (v2 has Markdown)
- **Path alias**: `@/*` → root (vite.config.ts)

## ANTI-PATTERNS (THIS PROJECT)

- **NEVER embed API keys in bundle**: Users input keys via UI, stored in localStorage (vite.config.ts:50)
- **DEPRECATED**: `chatHistory` field in UserResponse (types.ts:73) - use localStorage instead
- **DO NOT remove dist/**: Build artifacts committed for GH Pages deployment
- **AVOID adding react-router**: State-based routing is intentional design

## UNIQUE STYLES

- **CDN Tailwind**: Tailwind loaded via CDN in index.html, not PostCSS
- **Import maps**: Hybrid npm + import map dependency management
- **Centralized orchestrator**: App.tsx handles all state, no context providers
- **Backup artifacts in repo**: quizmaster-backup-*.json files present

## COMMANDS

```bash
npm run dev          # Start Vite dev server (port 3000)
npm run build        # Build for production (output: dist/)
npm run preview      # Preview production build
npm run app          # Build + preview on 127.0.0.1:3000
```

## NOTES

- **No test suite configured**: vitest installed but not wired into scripts
- **Node 18 in CI**: GitHub Actions uses Node 18, project supports modern features
- **PWA enabled**: vite-plugin-pwa with auto-update, offline support
- **Missing index.css**: Referenced in index.html but file doesn't exist (cleanup needed)
- **Backup files**: .bak files in components/ (BankManager.tsx.bak) - cleanup candidate
