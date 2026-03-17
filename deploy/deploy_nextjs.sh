#!/bin/bash
# =============================================
# prototype_cam_ts 배포 스크립트
# Deploy Agent(Claude) 전용 — web 경로 배포
# 사용법: ./deploy_nextjs.sh [BRANCH] [MESSAGE]
# =============================================

set -e

# ── 설정 ───────────────────────────────────────
REPO_ROOT="/Users/grey/Desktop/local_grey"
MODULE_PATH="web/react/prototype_cam_ts"
MODULE_DIR="$REPO_ROOT/$MODULE_PATH"
GITHUB_REMOTE="origin"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DEPLOY_LOG="$REPO_ROOT/deploy/deploy.log"
LATEST_FILE="$REPO_ROOT/deploy/LATEST_DEPLOY.txt"
GIT="git -C $REPO_ROOT"

# ── 색상 출력 ────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'
RED='\033[0;31m'; CYAN='\033[0;36m'; BLUE='\033[0;34m'; NC='\033[0m'

log()    { echo -e "${GREEN}[DEPLOY]${NC} $1"; echo "[$TIMESTAMP] $1" >> "$DEPLOY_LOG"; }
warn()   { echo -e "${YELLOW}[ WARN ]${NC} $1"; }
error()  { echo -e "${RED}[ERROR]${NC}  $1" >&2; exit 1; }
info()   { echo -e "${CYAN}[ INFO ]${NC} $1"; }
line()   { echo -e "${BLUE}────────────────────────────────────────${NC}"; }

# ── 사용법 ──────────────────────────────────────
usage() {
  echo ""
  echo -e "${CYAN}사용법:${NC}"
  echo "  ./deploy_nextjs.sh [브랜치] [변경내용 설명]"
  echo ""
  echo -e "${CYAN}예시:${NC}"
  echo "  ./deploy_nextjs.sh develop \"태스크 카드 UI 수정\""
  echo "  ./deploy_nextjs.sh main    \"QA 승인 완료 v1.0.1\""
  echo ""
  echo -e "${CYAN}특수 명령:${NC}"
  echo "  ./deploy_nextjs.sh status          현재 배포 상태 확인"
  echo "  ./deploy_nextjs.sh rollback [N]    N개 커밋 되돌리기"
  echo "  ./deploy_nextjs.sh diff            변경된 파일 목록 확인"
  echo ""
}

# ── 상태 확인 ─────────────────────────────────────
cmd_status() {
  line
  info "현재 배포 상태 (Next.js)"
  echo ""
  echo -e "${CYAN}▶ 최근 배포:${NC}"
  cat "$LATEST_FILE" 2>/dev/null || echo "  (배포 기록 없음)"
  echo ""
  echo -e "${CYAN}▶ 최근 커밋 5개:${NC}"
  $GIT log --oneline -5 -- "$MODULE_PATH" 2>/dev/null || echo "  (없음)"
  echo ""
  echo -e "${CYAN}▶ 현재 미배포 변경사항:${NC}"
  CHANGED=$($GIT diff --name-only HEAD -- "$MODULE_PATH" 2>/dev/null; \
            $GIT ls-files --others --exclude-standard "$MODULE_PATH" 2>/dev/null)
  if [ -z "$CHANGED" ]; then
    echo "  없음 (모두 최신 상태)"
  else
    echo "$CHANGED" | while read f; do echo "  → $f"; done
  fi
  line
}

# ── 변경 파일 확인 ───────────────────────────────
cmd_diff() {
  line
  info "prototype_cam_ts 변경 파일 목록"
  CHANGED=$($GIT diff --name-only HEAD -- "$MODULE_PATH" 2>/dev/null; \
            $GIT ls-files --others --exclude-standard "$MODULE_PATH" 2>/dev/null)
  if [ -z "$CHANGED" ]; then
    warn "변경된 파일이 없습니다"
  else
    echo "$CHANGED" | while read f; do echo "  → $f"; done
  fi
  line
}

# ── 롤백 ─────────────────────────────────────────
cmd_rollback() {
  local n="${1:-1}"
  line
  warn "롤백: 최근 ${n}개 커밋을 되돌립니다"
  echo -e "${RED}정말 되돌리시겠습니까? (yes 입력 시 실행)${NC}"
  read -r confirm
  [ "$confirm" = "yes" ] || { info "취소됨"; exit 0; }

  $GIT revert --no-edit HEAD~"$n"..HEAD
  $GIT push "$GITHUB_REMOTE" HEAD
  log "롤백 완료: ${n}개 커밋 되돌림"
}

# ── 사전 검증 ─────────────────────────────────────
pre_check() {
  line
  info "사전 검증 중..."

  command -v git >/dev/null 2>&1 || error "git이 설치되어 있지 않습니다"
  [ -d "$REPO_ROOT/.git" ] || error ".git 폴더가 없습니다"
  $GIT remote get-url "$GITHUB_REMOTE" >/dev/null 2>&1 || error "GitHub remote가 설정되지 않았습니다"
  [ -d "$MODULE_DIR" ] || error "모듈 경로가 없습니다: $MODULE_DIR"

  # .env가 git에 포함됐는지 확인
  if $GIT ls-files --error-unmatch "$MODULE_PATH/.env" >/dev/null 2>&1 || \
     $GIT ls-files --error-unmatch "$MODULE_PATH/.env.local" >/dev/null 2>&1; then
    error ".env 파일이 git에 포함되어 있습니다! API 키 노출 위험 — 즉시 제거 필요"
  fi

  log "사전 검증 통과 ✓"
}

# ── 변경사항 감지 ────────────────────────────────
detect_changes() {
  info "변경 파일 감지 중..."
  CHANGED=$($GIT diff --name-only HEAD -- "$MODULE_PATH" 2>/dev/null; \
            $GIT diff --cached --name-only -- "$MODULE_PATH" 2>/dev/null; \
            $GIT ls-files --others --exclude-standard "$MODULE_PATH" 2>/dev/null)

  if [ -z "$CHANGED" ]; then
    warn "배포할 변경사항이 없습니다"
    exit 0
  fi

  echo ""
  info "배포될 파일:"
  echo "$CHANGED" | while read f; do echo "  → $f"; done
  echo ""

  COUNT=$(echo "$CHANGED" | wc -l | tr -d ' ')
  log "변경 파일 ${COUNT}개 감지 ✓"
}

# ── Next.js 타입 체크 ─────────────────────────────
validate() {
  line
  info "타입 체크 중... (tsc --noEmit)"

  if ! command -v npx >/dev/null 2>&1; then
    warn "npx를 찾을 수 없습니다 — 타입 체크 건너뜀"
    return 0
  fi

  cd "$MODULE_DIR"
  npx tsc --noEmit 2>&1 | tail -5 || error "TypeScript 타입 오류가 있습니다. 수정 후 다시 배포하세요"
  cd "$REPO_ROOT"
  log "타입 체크 통과 ✓"
}

# ── main 브랜치 보호 ──────────────────────────────
require_qa_approval() {
  echo ""
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}⚠️  main 브랜치 배포 — QA 승인 필요${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  read -r -p "QA 승인 코드: " qa_code
  [ "$qa_code" = "QA-APPROVED" ] || error "승인 코드가 올바르지 않습니다"
  log "QA 승인 확인 ✓"
}

# ── Git 커밋 & Push ──────────────────────────────
git_push() {
  local branch="$1"
  local message="$2"
  line
  info "브랜치: $branch"
  info "메시지: $message"

  CURRENT=$($GIT branch --show-current 2>/dev/null || echo "unknown")
  if [ "$CURRENT" != "$branch" ]; then
    info "브랜치 전환: $CURRENT → $branch"
    $GIT checkout -B "$branch" 2>/dev/null || $GIT checkout "$branch"
  fi

  # web 경로만 스테이징
  $GIT add "$MODULE_PATH/"

  if $GIT diff --cached --quiet; then
    warn "스테이징된 변경사항이 없습니다"
    exit 0
  fi

  $GIT commit -m "[web] $message" \
               -m "배포 일시: $TIMESTAMP" \
               -m "브랜치: $branch" \
               -m "모듈: web/react/prototype_cam_ts"

  info "GitHub에 push 중..."
  $GIT push "$GITHUB_REMOTE" "$branch" 2>/dev/null || \
    $GIT push --set-upstream "$GITHUB_REMOTE" "$branch"

  HASH=$($GIT rev-parse --short HEAD)
  log "Push 완료: $HASH → $branch ✓"
}

# ── 배포 기록 저장 ────────────────────────────────
save_record() {
  local branch="$1"
  local message="$2"
  local hash=$($GIT rev-parse --short HEAD 2>/dev/null || echo "-")
  local remote=$($GIT remote get-url "$GITHUB_REMOTE" 2>/dev/null || echo "-")

  cat > "$LATEST_FILE" << RECORD
✅ 배포 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
모듈:    prototype_cam_ts (Next.js Web)
커밋:    $hash
브랜치:  $branch
메시지:  $message
일시:    $TIMESTAMP
GitHub:  $remote
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$([ "$branch" = "develop" ] && echo "📋 다음: QA 채팅에 검증 요청 필요" || echo "🎉 main 배포 완료")
RECORD

  log "배포 기록 저장 ✓"
}

# ═══════════════════════════════════════
# MAIN
# ═══════════════════════════════════════
BRANCH="${1:-develop}"
MESSAGE="${2:-변경사항 배포}"

case "$BRANCH" in
  help|-h|--help) usage; exit 0 ;;
  status)         cmd_status; exit 0 ;;
  diff)           cmd_diff; exit 0 ;;
  rollback)       cmd_rollback "$MESSAGE"; exit 0 ;;
esac

line
echo -e "${GREEN}"
echo "  🚀 prototype_cam_ts Deploy Agent"
echo "  Next.js Web 모듈 배포"
echo -e "${NC}"
line

[ "$BRANCH" = "main" ] && require_qa_approval

pre_check
detect_changes
validate
git_push "$BRANCH" "$MESSAGE"
save_record "$BRANCH" "$MESSAGE"

line
echo ""
echo -e "${GREEN}✅ 배포 완료!${NC}"
echo -e "   커밋: $($GIT rev-parse --short HEAD 2>/dev/null)"
echo -e "   브랜치: $BRANCH"
if [ "$BRANCH" = "develop" ]; then
  echo ""
  echo -e "${YELLOW}📋 다음 단계: QA 채팅에 아래 내용을 전달하세요${NC}"
  echo -e "   ─────────────────────────────────────────"
  echo -e "   [QA 검증 요청]"
  echo -e "   모듈: prototype_cam_ts (Next.js Web)"
  echo -e "   커밋: $($GIT rev-parse --short HEAD 2>/dev/null)"
  echo -e "   브랜치: develop"
  echo -e "   내용: $MESSAGE"
  echo -e "   GitHub: $($GIT remote get-url origin 2>/dev/null)/compare/main...develop"
  echo -e "   ─────────────────────────────────────────"
fi
echo ""
