---
plan_id: 2026-05-07-followup-C-audit-log
title: 보안 follow-up C — audit_logs 테이블 도입
status: pending
hard_gate: full
priority: MEDIUM
created: 2026-05-07
parent: 2026-05-06-security-patch-5-phase
total_tasks: 8
estimated_hours: 8-12
---

# Plan: 보안 follow-up C — audit_logs 테이블 도입

## Goal

OWASP A09 (Security Logging and Monitoring Failures) MEDIUM 해결. 인증·관리·삭제 이벤트를 영구 기록하는 `audit_logs` 테이블 + service-role 기반 기록 헬퍼 + 관리자 조회 UI 도입.

## Approach

Supabase 신규 테이블(RLS deny anon) + `lib/audit.ts` server-only helper + 관리·인증 핵심 지점에 호출 삽입 + `/api/admin/audit` GET endpoint + `/admin` 페이지에 감사 로그 탭. 운영에 즉시 가치.

## Out of Scope

- 외부 SIEM (Datadog/Splunk) 연동
- 30일 retention 자동화 — **별도 follow-up issue로 분리**
- IP·UserAgent 익명화·마스킹 정책 — 별도 PII 검토
- 알림(이메일·Slack) 통합

## 영향 파일

| 파일 | 변경 유형 | 비고 |
|---|---|---|
| `supabase/migrations/20260507_audit_logs.sql` | 신규 | 테이블·인덱스·RLS 정책 |
| `supabase/schema.sql` | 수정 | audit_logs 정의 추가 |
| `lib/audit.ts` | 신규 | `logAudit(action, target, metadata, req?)` server-only |
| `auth.ts` | 수정 | signIn 콜백에 success/failure 로그 |
| `app/api/admin-data/route.ts` | 수정 | POST 변경 시 로그 |
| `app/api/board/[id]/route.ts` | 수정 | DELETE 시 로그 |
| `app/api/admin/audit/route.ts` | 신규 | GET 페이지네이션 + isAdmin 가드 |
| `app/admin/layout.tsx` | 수정 | 탭 네비 추가 (선택) |
| `app/admin/audit/page.tsx` | 신규 | 감사 로그 테이블 UI |

## 단계

### C-T1: 마이그레이션 작성·적용
- **상태**: pending
- **파일**: `supabase/migrations/20260507_audit_logs.sql`
- **변경**:
```sql
create table audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references users(id),
  user_email text,
  action text not null,
  target text,
  metadata jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);
create index idx_audit_logs_created_at on audit_logs(created_at desc);
create index idx_audit_logs_action on audit_logs(action);
create index idx_audit_logs_user on audit_logs(user_id);
alter table audit_logs enable row level security;
comment on table audit_logs is 'RLS: anon deny. Server-only via service_role.';
```
- **DoD**: Supabase Studio에서 SQL 실행 성공. anon 키로 REST `/rest/v1/audit_logs` SELECT → 0 rows / 401. service_role 키 INSERT 성공.
- **의존**: 없음

### C-T2: `lib/audit.ts` server-only 헬퍼
- **상태**: pending
- **파일**: `lib/audit.ts` (신규)
- **변경**:
```ts
import 'server-only';
import { supabaseAdmin } from './supabase';
import type { NextRequest } from 'next/server';

export type AuditAction =
  | 'login.success' | 'login.failure'
  | 'admin.data.update' | 'admin.data.delete'
  | 'board.post.delete' | 'board.post.update'
  | 'secret.rotation';

export async function logAudit(opts: {
  action: AuditAction;
  userId?: string;
  userEmail?: string;
  target?: string;
  metadata?: Record<string, unknown>;
  req?: NextRequest;
}): Promise<void> {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      user_id: opts.userId,
      user_email: opts.userEmail,
      action: opts.action,
      target: opts.target,
      metadata: opts.metadata,
      ip_address: opts.req?.headers.get('x-forwarded-for') ?? null,
      user_agent: opts.req?.headers.get('user-agent') ?? null,
    });
  } catch (e) {
    // 감사 로그 실패가 운영을 막으면 안 됨. 콘솔만 기록.
    console.error('[audit] failed to log:', opts.action, e);
  }
}
```
- **DoD**: tsc 0 errors. 단일 호출로 row 1개 생성 확인 (Supabase Studio).
- **의존**: C-T1

### C-T3: NextAuth signIn 콜백 통합
- **상태**: pending
- **파일**: `auth.ts`
- **변경**: `signIn` 콜백에 `logAudit({ action: 'login.success', userEmail, ... })` 추가. 실패 케이스(`return false`) 시 `'login.failure'`.
- **DoD**: 정상 로그인 1회 → row 1 (action='login.success'). 차단된 사용자 시도 → row 1 (action='login.failure').
- **의존**: C-T2

### C-T4: 관리자 변경 API 통합
- **상태**: pending
- **파일**: `app/api/admin-data/route.ts`
- **변경**: POST 핸들러 끝에서 upsert 성공 시 `logAudit({ action: 'admin.data.update', userEmail: guard.email, target: \`year=${year}\` })`.
- **DoD**: admin-data 1회 변경 → row 1.
- **의존**: C-T2

### C-T5: 게시판 삭제 통합
- **상태**: pending
- **파일**: `app/api/board/[id]/route.ts`
- **변경**: DELETE 핸들러에 `logAudit({ action: 'board.post.delete', target: \`id=${id}\` })`.
- **DoD**: 게시판 삭제 1회 → row 1.
- **의존**: C-T2

### C-T6: `/api/admin/audit` GET endpoint
- **상태**: pending
- **파일**: `app/api/admin/audit/route.ts` (신규)
- **변경**: `requireAdminSession` 가드 + zod query schema(`page`, `action?`) + supabaseAdmin select with order/range.
- **DoD**: 비관리자 401/403, 관리자 200 + JSON `{ data: [...], totalCount, page }`.
- **의존**: C-T2

### C-T7: 관리자 UI 탭
- **상태**: pending
- **파일**: `app/admin/audit/page.tsx` (신규), `app/admin/layout.tsx` 또는 navigation 컴포넌트
- **변경**: server component로 `/api/admin/audit` 호출 → 테이블 (시각·user·action·target). 페이지네이션 + action 필터.
- **DoD**: `/admin/audit` 진입 시 최근 50건 렌더, action 필터 동작.
- **의존**: C-T6

### C-T8: RLS 침투 테스트
- **상태**: pending
- **파일**: 없음 (검증)
- **변경**: anon REST `/rest/v1/audit_logs` SELECT/INSERT 시도 → 모두 차단. service_role로는 정상.
- **DoD**: 테스트 결과 진행 추적 표에 첨부.
- **의존**: C-T1, C-T2

## 리스크

- **service_role 키 클라이언트 노출** → `lib/audit.ts`는 `import 'server-only'` 가드로 client bundle 차단.
- **로그 폭주 → DB 비용** → retention은 별도 follow-up. 임시로는 무한 누적 (Supabase 무료 tier 500MB 한도).
- **PII (IP·UA) 보존** → 한국 개인정보보호법 영향 검토 필요. 임시 수집은 보안 monitoring 목적 정당화 가능. 별도 retention/익명화 정책 follow-up 등록 권장.
- **로그 실패 시 운영 중단** → C-T2 helper에 try/catch + console.error fallback.

## 진행 추적

| 시각 | 단계 | 상태 변경 | 비고 |
|---|---|---|---|
| 2026-05-07T... | — | plan 저장 | sub-plan B/A 완료 후 시작 권장 |
