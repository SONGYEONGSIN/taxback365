#!/usr/bin/env bash
# vibe-flow statusline (merged)
#
# Output: <parent>/<dir> | <model> | ctx:N% <bar> | <branch> | <tier> | 5h:N% <bar> (Hh Mm) [ · ✓v · 🔧✓ · 📋 N/M (name) ]
#
# Env:
#   VIBE_FLOW_STATUSLINE=off       — disable (empty output)
#   VIBE_FLOW_STATUSLINE_VERBOSE=1 — verbose form for vibe-flow extras

[ "$VIBE_FLOW_STATUSLINE" = "off" ] && exit 0

export PYTHONIOENCODING=utf-8

input=$(cat)

# ─── Helper: colored gauge bar ──────────────────────────────────────────
make_bar() {
  python3 -c "
import sys
pct = int(sys.argv[1]) if sys.argv[1:] else 0
pct = max(0, min(100, pct))
BAR_LEN = 10
filled = round(pct / 100 * BAR_LEN)
empty  = BAR_LEN - filled
RESET, GREEN, YELLOW, RED = '\033[0m', '\033[32m', '\033[33m', '\033[31m'
color = GREEN if pct < 60 else (YELLOW if pct <= 80 else RED)
print(color + ('▰' * filled) + ('▱' * empty) + RESET, end='')
" "$1" 2>/dev/null
}

# ─── 1. Workspace label (last 2 path segments) ──────────────────────────
cwd=$(echo "$input" | python3 -c "
import sys, json, pathlib
d = json.load(sys.stdin)
raw = d.get('workspace', {}).get('current_dir') or d.get('cwd', '')
if raw:
    p = pathlib.PurePosixPath(raw.replace('\\\\', '/'))
    parts = p.parts
    if len(parts) >= 2:
        print(parts[-2] + '/' + parts[-1])
    elif len(parts) == 1:
        print(parts[-1])
    else:
        print('--')
else:
    print('--')
" 2>/dev/null)
[ -z "$cwd" ] && cwd="--"

# ─── 2. Model display name ──────────────────────────────────────────────
model=$(echo "$input" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('model',{}).get('display_name','--'))" 2>/dev/null)
[ -z "$model" ] && model="--"

# ─── 3. Context used % + bar ────────────────────────────────────────────
ctx_raw=$(echo "$input" | python3 -c "import sys,json; d=json.load(sys.stdin); v=d.get('context_window',{}).get('used_percentage'); print(v if v is not None else '')" 2>/dev/null)
if [ -n "$ctx_raw" ]; then
  ctx=$(python3 -c "print(round(float('$ctx_raw')))" 2>/dev/null)
  ctx_bar=$(make_bar "$ctx")
  ctx_str="ctx:${ctx}% ${ctx_bar}"
else
  ctx_str="ctx:--% ----------"
fi

# ─── 4. Git branch ──────────────────────────────────────────────────────
cwd_path=$(echo "$input" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('workspace',{}).get('current_dir') or d.get('cwd',''))" 2>/dev/null)
if [ -n "$cwd_path" ] && [ -d "$cwd_path" ]; then
  branch=$(git --no-optional-locks -C "$cwd_path" branch --show-current 2>/dev/null)
fi
[ -z "$branch" ] && branch=$(git --no-optional-locks branch --show-current 2>/dev/null)
[ -z "$branch" ] && branch="--"

# ─── 5. Subscription tier ───────────────────────────────────────────────
tier=$(python3 -c "
import json, os
try:
    with open(os.path.expanduser('~/.claude/.credentials.json')) as f:
        data = json.load(f)
    print(data['claudeAiOauth']['subscriptionType'].capitalize())
except Exception:
    pass
" 2>/dev/null)

# ─── 6. Rate-limit windows (5h / 7d / 7d-opus) ──────────────────────────
# Args: <key> (five_hour|seven_day|seven_day_opus)
build_window() {
  local key="$1" label="$2" unit="$3"
  local raw
  raw=$(echo "$input" | python3 -c "
import sys, json, time
try:
    d = json.load(sys.stdin)
    w = d.get('rate_limits', {}).get('$key', {})
    pct = w.get('used_percentage')
    if pct is None:
        print(''); sys.exit(0)
    pct_int = round(float(pct))
    resets_at = w.get('resets_at')
    if resets_at is None:
        print(f'{pct_int}|'); sys.exit(0)
    remaining = max(0, int(resets_at) - int(time.time()))
    if remaining >= 86400:
        d_, rem = remaining // 86400, remaining % 86400
        h = rem // 3600
        s = f'{d_}d{h}h'
    else:
        h, m = remaining // 3600, (remaining % 3600) // 60
        s = f'{h}h{m}m'
    print(f'{pct_int}|{s}')
except Exception:
    print('')
" 2>/dev/null)
  if [ -z "$raw" ]; then
    printf '%s:--%% ----------' "$label"
    return
  fi
  local p="${raw%%|*}" t="${raw##*|}" b
  b=$(make_bar "$p")
  if [ -n "$t" ]; then
    printf '%s:%s%% %s (%s)' "$label" "$p" "$b" "$t"
  else
    printf '%s:%s%% %s' "$label" "$p" "$b"
  fi
}

five_display=$(build_window five_hour "5h")
week_display=$(build_window seven_day "7d")

# ─── 7. vibe-flow extras (verify / hook / plan) ─────────────────────────
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$cwd_path}"
EVENTS="$PROJECT_DIR/.claude/events.jsonl"
PLANS_DIR="$PROJECT_DIR/.claude/plans"
VERBOSE="${VIBE_FLOW_STATUSLINE_VERBOSE:-0}"
extras=()

if [ -f "$EVENTS" ]; then
  LAST_VERIFY=$(tail -200 "$EVENTS" 2>/dev/null \
    | jq -s 'map(select(.type=="verify_complete")) | last' 2>/dev/null)
  VERIFY_OVERALL=$(echo "$LAST_VERIFY" | jq -r '.overall // ""' 2>/dev/null)
  if [ "$VERIFY_OVERALL" = "pass" ]; then
    extras+=("✓v")
  elif [ "$VERIFY_OVERALL" = "fail" ]; then
    FAIL_COUNT=$(echo "$LAST_VERIFY" | jq -r '.results | map(select(.status=="fail")) | length' 2>/dev/null)
    [ -z "$FAIL_COUNT" ] || [ "$FAIL_COUNT" = "null" ] && FAIL_COUNT=0
    extras+=("✗v(${FAIL_COUNT})")
  fi

  LAST_TOOL=$(tail -50 "$EVENTS" 2>/dev/null \
    | jq -s 'map(select(.type=="tool_result" or .type=="tool_failure")) | last' 2>/dev/null)
  TOOL_TYPE=$(echo "$LAST_TOOL" | jq -r '.type // ""' 2>/dev/null)
  if [ "$TOOL_TYPE" = "tool_result" ]; then
    extras+=("🔧✓")
  elif [ "$TOOL_TYPE" = "tool_failure" ]; then
    HOOK_NAME=$(echo "$LAST_TOOL" | jq -r '.tool // .error_class // "?"' 2>/dev/null | head -c 12)
    extras+=("🔧✗ ${HOOK_NAME}")
  fi
fi

if [ -d "$PLANS_DIR" ]; then
  ACTIVE_PLAN=$(grep -l "^status: in_progress" "$PLANS_DIR"/*.md 2>/dev/null | head -1)
  if [ -n "$ACTIVE_PLAN" ]; then
    DONE=$(grep -c "^- \[x\]" "$ACTIVE_PLAN" 2>/dev/null); [ -z "$DONE" ] && DONE=0
    TOTAL=$(grep -cE "^- \[[ x]\]" "$ACTIVE_PLAN" 2>/dev/null); [ -z "$TOTAL" ] && TOTAL=0
    PLAN_NAME=$(basename "$ACTIVE_PLAN" .md | sed 's/^[0-9-]*//' | head -c 20)
    [ "$TOTAL" -gt 0 ] && extras+=("📋${DONE}/${TOTAL} (${PLAN_NAME})")
  fi
fi

# ─── Assemble output ────────────────────────────────────────────────────
parts="$cwd | $model | $ctx_str | $branch"
[ -n "$tier" ] && parts="$parts | $tier"
parts="$parts | $five_display"
[ -n "$week_display" ] && parts="$parts | $week_display"

if [ ${#extras[@]} -gt 0 ]; then
  IFS=" · "
  parts="$parts · ${extras[*]}"
fi

printf "%s" "$parts"
