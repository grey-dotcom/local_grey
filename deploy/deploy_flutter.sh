#!/bin/bash
# =============================================
# prototype_cam 배포 스크립트
# Deploy Agent(Claude) 전용
# 사용법: ./deploy_flutter.sh [BRANCH] [MESSAGE]
# =============================================

set -e

# ── 설정 ───────────────────────────────────────
REPO_ROOT="/Users/grey/Desktop/local_grey"
MODULE_PATH="app/flutter/prototype_cam"
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

# ── 사용법 안내 ──────────────────────────────────
usage() {
  echo ""
  echo -e "${CYAN}사용법:${NC}"
  echo "  ./deploy_flutter.sh [브랜치] [변경내용 설명]"
  echo ""
  echo -e "${CYAN}예시:${NC}"
  echo "  ./deploy_flutter.sh develop \"카메라 셔터 버튼 UI 수정\""
  echo "  ./deploy_flutter.sh main    \"QA 승인 완료 v1.0.1\""
  echo ""
  echo -e "${CYAN}특수 명령:${NC}"
  echo "  ./deploy_flutter.sh status          현재 배포 상태 확인"
  echo "  ./deploy_flutter.sh rollback [N]    N개 커밋 되돌리기"
  echo "  ./deploy_flutter.sh diff            변경된 파일 목록만 확인"
  echo ""
}

# ── 상태 확인 ─────────────────────────────────────
cmd_status() {
  line
  info "현재 배포 상태"
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
  info "prototype_cam 변경 파일 목록"
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

  # git 확인
  command -v git >/dev/null 2>&1 || error "git이 설치되어 있지 않습니다"

  # 레포 확인
  [ -d "$REPO_ROOT/.git" ] || error ".git 폴더가 없습니다. GitHub 연결 상태를 확인하세요"

  # remote 확인
  $GIT remote get-url "$GITHUB_REMOTE" >/dev/null 2>&1 || \
    error "GitHub remote가 설정되지 않았습니다"

  # 모듈 폴더 확인
  [ -d "$MODULE_DIR" ] || error "모듈 경로가 없습니다: $MODULE_DIR"

  # .env가 git에 포함됐는지 확인 (포함되면 즉시 차단)
  if $GIT ls-files --error-unmatch "$MODULE_PATH/.env" >/dev/null 2>&1; then
    error ".env 파일이 git에 포함되어 있습니다! 즉시 제거 필요"
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
    warn "배포할 변경사항이 없습니다 (이미 최신 상태)"
    exit 0
  fi

  echo ""
  info "배포될 파일:"
  echo "$CHANGED" | while read f; do echo "  → $f"; done
  echo ""

  COUNT=$(echo "$CHANGED" | wc -l | tr -d ' ')
  log "변경 파일 ${COUNT}개 감지 ✓"
}

# ── Flutter 코드 검증 ─────────────────────────────
validate() {
  line
  info "코드 검증 중... (flutter analyze)"

  if ! command -v flutter >/dev/null 2>&1; then
    warn "flutter 명령어를 찾을 수 없습니다 — 검증 건너뜀"
    return 0
  fi

  cd "$MODULE_DIR"
  flutter analyze --no-fatal-infos 2>&1 | tail -5 || error "코드 오류가 있습니다. 수정 후 다시 배포하세요"
  cd "$REPO_ROOT"
  log "코드 검증 통과 ✓"
}

# ── main 브랜치 보호 ──────────────────────────────
require_qa_approval() {
  echo ""
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}⚠️  main 브랜치 배포 — QA 승인 필요${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "QA 채팅에서 승인 코드를 받아 아래에 입력하세요:"
  read -r -p "QA 승인 코드: " qa_code
  [ "$qa_code" = "QA-APPROVED" ] || error "승인 코드가 올바르지 않습니다. 배포를 중단합니다"
  log "QA 승인 확인 ✓"
}

# ── Git 커밋 & Push ──────────────────────────────
git_push() {
  local branch="$1"
  local message="$2"
  line
  info "브랜치: $branch"
  info "메시지: $message"

  # 브랜치 전환
  CURRENT=$($GIT branch --show-current 2>/dev/null || echo "unknown")
  if [ "$CURRENT" != "$branch" ]; then
    info "브랜치 전환: $CURRENT → $branch"
    $GIT checkout -B "$branch" 2>/dev/null || $GIT checkout "$branch"
  fi

  # 모듈 파일만 스테이징
  $GIT add "$MODULE_PATH/"

  # 변경사항 없으면 종료
  if $GIT diff --cached --quiet; then
    warn "스테이징된 변경사항이 없습니다"
    exit 0
  fi

  # 커밋
  $GIT commit -m "[prototype_cam] $message" \
               -m "배포 일시: $TIMESTAMP" \
               -m "브랜치: $branch" \
               -m "모듈: app/flutter/prototype_cam"

  # Push
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
모듈:    prototype_cam (Flutter 카메라)
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

# 특수 커맨드 분기
case "$BRANCH" in
  help|-h|--help) usage; exit 0 ;;
  status)         cmd_status; exit 0 ;;
  diff)           cmd_diff; exit 0 ;;
  rollback)       cmd_rollback "$MESSAGE"; exit 0 ;;
esac

line
echo -e "${GREEN}"
echo "  🚀 prototype_cam Deploy Agent"
echo "  Flutter 카메라 모듈 배포"
echo -e "${NC}"
line

# main이면 QA 승인 먼저
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
  echo -e "   모듈: prototype_cam (Flutter 카메라)"
  echo -e "   커밋: $($GIT rev-parse --short HEAD 2>/dev/null)"
  echo -e "   브랜치: develop"
  echo -e "   내용: $MESSAGE"
  echo -e "   GitHub: $($GIT remote get-url origin 2>/dev/null)/compare/main...develop"
  echo -e "   ─────────────────────────────────────────"
fi
echo ""
