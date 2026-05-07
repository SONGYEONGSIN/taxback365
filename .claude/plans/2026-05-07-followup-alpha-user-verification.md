---
plan_id: 2026-05-07-followup-alpha-user-verification
title: 보안 follow-up α — 사용자 환경 검증 통합 체크리스트
status: pending
hard_gate: inline
priority: HIGH
created: 2026-05-07
parent: 2026-05-06-security-patch-5-phase
related:
  - 2026-05-07-followup-B-xlsx-replace (B-T5)
  - 2026-05-07-followup-A-lint-and-cleanup (A-T9)
  - 2026-05-07-followup-C-audit-log (C-T1, C-T8)
total_tasks: 4
estimated_minutes: 45-60
---

# α 트랙 — 사용자 환경 검증 (코드 변경 없음)

> 이 가이드는 **사용자가 직접** 실행해야 끝나는 검증 4건을 한 문서로 묶은 체크리스트다.
> Claude는 코드 변경 없이 결과만 받아 `B/A/C` plan의 진행 추적 표를 마감한다.

## 사전 준비

- [ ] 최신 코드 배포 상태 확인 (`git log -1 --oneline` → `0dda4df chore: force rebuild`가 main HEAD)
- [ ] Vercel 운영 URL 접속 가능: `https://taxback365.vercel.app`
- [ ] Supabase Studio 접근 권한 (project: tax-back-365)
- [ ] 관리자 계정으로 로그인 가능
- [ ] 샘플 .xlsx 파일 1개 준비 (이전에 정상 업로드되던 급여 엑셀 또는 카드사 엑셀)

---

## ① B-T5 — .xlsx 업로드 회귀 검증

`xlsx` → `exceljs` 교체 후 두 핸들러가 동일한 행/필드값을 추출하는지 확인.

### 핸들러 1: 급여 엑셀 (`processExcelFile`, `app/admin/page.tsx:415`)

- [ ] `/admin` 진입 → "엑셀 업로드" 영역에서 샘플 .xlsx 선택
- [ ] **DevTools Console 확인**: 에러 없음, `console.log('Excel data')`/`console.log('Headers:')` 등 출력 정상
- [ ] UI에 월별 급여 데이터(1~12월)가 자동 채워지는지 확인
- [ ] **DB 확인**: Supabase Studio → `admin_data` 테이블 → 해당 연도 row의 `monthlySalaryData` 컬럼이 갱신됨
- [ ] **회귀 기준**: xlsx 시절 결과(이전 row 또는 이전 스크린샷)와 행 수·필드값 100% 일치

### 핸들러 2: 카드사 엑셀 (`processCardExcelFile`, `app/admin/page.tsx:564`)

- [ ] `/admin` 진입 → "카드사 엑셀 업로드" 영역에서 샘플 .xlsx 선택
- [ ] DevTools Console: `Excel data rows:`, `First row (header):`, `Second row (data sample):` 출력 정상
- [ ] UI에 카드 사용 내역 분류 결과가 표시되는지 확인
- [ ] **회귀 기준**: 동일 입력 → 동일 분류 결과

### 실패 시 디버깅

- 빈 결과 → wrapper의 `worksheets[0]`가 첫 시트 추출에 실패. `worksheet.eachRow`가 호출되는지 console.log 추가
- 날짜 깨짐 → `lib/excel-import.ts:31`의 `Date → ISO string` 변환이 후속 파서와 충돌. xlsx 시절은 Excel serial number였음 → 이전 동작 복원 시 wrapper에서 `v.getTime()` 또는 serial number 변환 추가

---

## ② C-T1 — Supabase audit_logs 마이그레이션 적용

`supabase/migrations/20260507_audit_logs.sql`을 운영 DB에 적용한다.

### 적용 절차

1. Supabase Dashboard → 해당 프로젝트 → **SQL Editor**
2. 새 쿼리 → 아래 SQL **전문** 붙여넣기 (또는 `supabase/migrations/20260507_audit_logs.sql` 파일 내용 복사):

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    target TEXT,
    metadata JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE audit_logs IS 'RLS: anon deny (no policy). service_role bypasses. All inserts via lib/audit.ts (server-only).';
```

3. **Run** 클릭 → 성공 메시지 확인

### 적용 후 검증

- [ ] Studio → Table Editor → `audit_logs` 테이블이 보임
- [ ] 컬럼 9개 확인: `id, user_id, user_email, action, target, metadata, ip_address, user_agent, created_at`
- [ ] 인덱스 3개 확인 (`idx_audit_logs_created_at`, `_action`, `_user_id`) — Database → Indexes 메뉴
- [ ] **RLS 활성** 표시 확인 (테이블 헤더의 자물쇠 아이콘)
- [ ] **첫 로그 자동 생성**: 운영 URL에서 Google 로그인 1회 → `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 1` → action='login.success' row 1개

---

## ③ C-T8 — audit_logs RLS 침투 테스트

`audit_logs`가 **anon 키로 읽기/쓰기 모두 차단**되는지 확인.

### 준비: anon 공개키 확인

- Supabase Dashboard → Project Settings → API → `anon public` 키 복사 (PROJECT_URL도 같은 페이지)

### 테스트 1: anon 키로 SELECT 시도 → 차단 확인

```bash
curl -s -w "\n[HTTP %{http_code}]\n" \
  "https://<PROJECT_REF>.supabase.co/rest/v1/audit_logs?select=*&limit=1" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>"
```

- [ ] 응답이 빈 배열 `[]` 또는 401 — **둘 다 OK** (RLS deny → 결과 없음 / 정책 미존재 → 401)
- [ ] **실제 row 데이터가 노출되면 FAIL** — RLS가 활성화되지 않았거나 정책이 잘못 설정됨

### 테스트 2: anon 키로 INSERT 시도 → 차단 확인

```bash
curl -s -w "\n[HTTP %{http_code}]\n" -X POST \
  "https://<PROJECT_REF>.supabase.co/rest/v1/audit_logs" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"action":"test.injection","user_email":"attacker@example.com"}'
```

- [ ] HTTP 401 또는 403 또는 빈 응답 (정책 위반)
- [ ] Studio에서 `SELECT * FROM audit_logs WHERE action='test.injection'` → 0 rows (PASS)

### 테스트 3: 정상 로그가 server에서만 기록되는지 확인

- [ ] 운영 URL에서 로그인 1회 → Studio → audit_logs에 `login.success` row 추가 확인
- [ ] `/admin` 진입 후 admin-data 변경 1회 → `admin.data.update` row 추가 확인
- [ ] 게시판 글 1개 삭제 → `board.post.delete` row 추가 확인

### 실패 시

- anon으로 SELECT/INSERT 성공 → C-T1의 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`가 실행 안 됨. Studio에서 다시 실행
- 정상 로그가 안 쌓임 → Vercel logs에서 `[audit] failed to log:` 검색. service_role 키 환경변수(`SUPABASE_SERVICE_ROLE_KEY`) 누락 가능

---

## ④ A-T9 — CSP 위반 모니터링 (30분 세션)

운영 도메인에서 모든 페이지를 순회하며 CSP 위반(외부 도메인 차단)을 수집한다.

### 현재 CSP 화이트리스트 (`next.config.mjs:19-30`)

| 지시어 | 허용 도메인 |
|---|---|
| `script-src` | self + `'unsafe-inline'` + `'unsafe-eval'` |
| `style-src` | self + `'unsafe-inline'` |
| `img-src` | self + data: + dicebear.com + lh3.googleusercontent.com |
| `connect-src` | self + *.supabase.co + generativelanguage.googleapis.com + accounts.google.com + *.upstash.io + apis.data.go.kr + api.odcloud.kr |
| `frame-src` | self + accounts.google.com |
| `font-src` | self + data: |

### 절차

1. Chrome 시크릿 창 → DevTools 오픈 (F12) → Console 탭 → "Errors only" 필터
2. `https://taxback365.vercel.app` 접속 → Google 로그인
3. 아래 페이지를 **순서대로** 방문하며 약 2~3분씩 머물기:

- [ ] `/` (랜딩)
- [ ] `/login` (로그인 화면 — 위반 발생 시 OAuth 도메인 누락 의심)
- [ ] `/dashboard` (Gemini AI 추천 호출 → connect-src 검증)
- [ ] `/calculator` (계산기 — 무거운 클라이언트 로직)
- [ ] `/board` 목록 → 게시글 1개 진입 → react-markdown 렌더 검증
- [ ] `/board/write` → 마크다운 미리보기에 외부 이미지/링크 삽입 시도
- [ ] `/admin` → 엑셀 업로드 영역 진입 (관리자 계정)
- [ ] `/admin/audit` (감사 로그 탭 — C-T7)
- [ ] `/news` 또는 뉴스 호출 페이지 (RSS XML 처리 — connect-src apis.data.go.kr)
- [ ] `/hospital` `/pharmacy` (외부 데이터 API 호출)

### 위반 발생 시

DevTools Console에서 다음 패턴이 보이면 **도메인을 기록**:
- `Refused to load the script from 'https://X' because it violates the following Content Security Policy directive: "script-src ..."`
- `Refused to connect to 'https://X' because ...`
- `Refused to load the image 'https://X' because ...`

기록 양식:
```
[위반 1] 페이지: /dashboard
지시어: connect-src
도메인: https://example-cdn.com/...
용도(추정): ?
조치: next.config.mjs CSP에 추가 / 정당하지 않으면 거부
```

### 위반 처리 결정 트리

```
도메인 정당성 확인:
├─ 우리가 의도한 외부 호출인가? (Gemini, Supabase, OAuth, 공공 API)
│   └─ 예 → CSP 화이트리스트에 추가 (next.config.mjs)
├─ 광고/추적 SDK인가?
│   └─ 어디서 들어왔는지 추적 (의도하지 않은 의존성 가능성). 차단 유지
└─ 알 수 없음
    └─ 차단 유지 + 별도 follow-up 이슈 등록
```

### 결과 기록

- [ ] 30분 세션 종료 후 위반 0건 → A-T9 status=`done`
- [ ] 위반 발견 → 도메인 목록 기록 + Claude에게 `next.config.mjs` 패치 요청

---

## 종료 기준

4개 항목 모두 결과를 받으면 Claude가 다음을 자동으로 수행:

1. `2026-05-07-followup-B-xlsx-replace.md` → B-T5 status=`done` (또는 회귀 발견 시 revise 노트)
2. `2026-05-07-followup-C-audit-log.md` → C-T1, C-T8 status=`done`
3. `2026-05-07-followup-A-lint-and-cleanup.md` → A-T9 status=`done` 또는 위반 패치 후 done
4. 결과 요약을 본 plan 진행 추적 표에 기록

## 진행 추적

| 시각 | 항목 | 상태 | 결과 |
|---|---|---|---|
| 2026-05-07 | — | plan 저장 | 4개 항목 통합 |
| TBD | B-T5 | pending | |
| TBD | C-T1 | pending | |
| TBD | C-T8 | pending | |
| TBD | A-T9 | pending | |
