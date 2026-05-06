# taxback365

연말정산 환급을 위한 SaaS — Next.js 15 + Supabase + NextAuth

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack) + TypeScript
- **Styling**: Tailwind CSS 4 (`@theme inline` config-less, Neo-Brutalism)
- **Auth**: NextAuth.js v5 (Google OAuth, JWT)
- **Database**: Supabase (PostgreSQL, `@supabase/ssr`)
- **Linting**: Next ESLint
- **Testing**: 미구성 — Vitest/Playwright 도입 시 별도 추가 필요

## Project Structure

```
taxback365/
├── .claude/             # vibe-flow 설정 (agents/rules/hooks/skills/memory/metrics)
├── app/                 # Next.js App Router 페이지/라우트 핸들러
│   ├── api/             # Route Handlers (NextAuth, Supabase 등)
│   ├── (도메인별 폴더)/   # admin, board, calculator, dashboard, login, signup, ...
│   └── globals.css      # Tailwind v4 + 디자인 토큰 1차 출처 (@theme inline)
├── components/          # React 컴포넌트
│   ├── ui/              # 원자(atom) 컴포넌트
│   ├── layout/          # 레이아웃
│   ├── providers/       # 전역 Provider
│   └── seo/             # SEO 메타/구조화 데이터
├── lib/                 # 도메인 로직·유틸 (Supabase 클라이언트, 세금 계산 등)
│   └── design-tokens.ts # globals.css 변수 미러링 (TS as const)
├── supabase/            # DB 마이그레이션·스키마
│   ├── migrations/
│   └── schema.sql
├── public/              # 정적 자산
├── auth.ts              # NextAuth v5 엔트리
├── CLAUDE.md
└── package.json
```

## Design System

- **Design Tokens**: 1차 출처는 `app/globals.css`의 `:root` CSS 변수 + `@theme inline` 블록 (Tailwind v4 config-less)
- **TS 미러**: `lib/design-tokens.ts` — `as const` 객체로 globals.css와 동기화
- **Common Components**: `components/common/` — 재사용 UI 패턴 (3회+ 반복 시 추출)
- **색상 규칙**: 컴포넌트에서 하드코딩 hex/rgb/hsl/oklch 금지, Tailwind 클래스 또는 토큰 사용
- **검증**: `.claude/hooks/design-lint.sh`가 Write/Edit 시 자동 감지, `/design-audit`로 전체 스캔

## Commands

```bash
npm run dev          # 개발 서버 (next dev --turbopack)
npm run build        # 프로덕션 빌드
npm run lint         # next lint (ESLint)
npx tsc --noEmit     # 타입 체크
```

## Rules

프로젝트 규칙은 `.claude/rules/`에 분리 관리:

- `conventions.md` — 설계 선행 원칙, 코드 스타일, Server Action 패턴
- `git.md` — Conventional Commits, HARD-GATE 설계 등급, Git Worktree
- `donts.md` — 금지 사항, 완료 기준, 합리화 방지 표
- `tdd.md` — TDD Iron Law (RED-GREEN-REFACTOR 강제)
- `debugging.md` — 4단계 체계적 디버깅 프로세스
- `design.md` — 디자인 토큰, 색상 규칙, 공통 컴포넌트

## Learning System

코드 수정 시 메트릭이 자동 수집되고, 학습 내용이 `.claude/memory/`에 축적된다:

- 새 세션 시작 시 `.claude/memory/patterns.md`를 읽어 이전 학습 활용
- `/learn save pattern` — 발견한 코드 패턴 저장
- `/learn save error` — 해결한 에러 패턴 저장
- `/metrics` — 빌드 성공률, 에러 빈도 대시보드
- `/retrospective` — 종합 회고 분석 실행
