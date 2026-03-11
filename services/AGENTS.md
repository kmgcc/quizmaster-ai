# Services Module

## OVERVIEW

API clients and business logic - AI services, grading, validation.

## STRUCTURE

```
services/
├── aiClient.ts          # ~380 lines - Streaming AI chat client
├── geminiService.ts     # ~120 lines - Google AI service wrapper
├── gradingLogic.ts      # ~60 lines - Answer grading utilities
└── validator.ts         # ~80 lines - Question bank schema validation
```

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| AI streaming chat | `aiClient.ts` | DeepSeek API, snapshot streaming |
| Google AI integration | `geminiService.ts` | Gemini SDK wrapper |
| Answer validation | `gradingLogic.ts` | LLM grading, regex matching |
| Schema validation | `validator.ts` | V1/V2 bank schema checks |

## CONVENTIONS

- **Functional modules**: No classes, pure functions only
- **Explicit types**: All interfaces defined in types.ts, not here
- **No side effects**: Services are pure, called from components
- **Error handling**: Return structured errors, don't throw

## ANTI-PATTERNS

- **NEVER embed API keys**: Keys from localStorage, passed at runtime
- **DO NOT add state**: Services are stateless, state in App.tsx
- **AVOID direct localStorage access**: Use services/backup.ts instead

## NOTES

- **DeepSeek primary**: Main AI provider via aiClient.ts
- **Gemini secondary**: geminiService.ts present but less used
- **LLM grading**: gradingLogic.ts supports both rule-based and LLM grading
