#!/bin/bash
# =============================================
# 브랜치 구조 일괄 변경 스크립트
# develop → dev, main → prod
# 로컬 폴더 구조는 변경하지 않음
# =============================================

set -e

REPO_ROOT="/Users/grey/Desktop/local_grey"
GIT="git -C $REPO_ROOT"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'
RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'

log()   { echo -e "${GREEN}[SETUP]${NC} $1"; }
info()  { echo -e "${CYAN}[ INFO ]${NC} $1"; }
warn()  { echo -e "${YELLOW}[ WARN ]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; exit 1; }
line()  { echo -e "${CYAN}────────────────────────────────────────${NC}"; }

cd "$REPO_ROOT"

line
echo -e "${GREEN}"
echo "  브랜치 구조 변경"
echo "  develop → dev  |  main → prod"
echo -e "${NC}"
line

# Step 1 — React 변경사항 stash
info "Step 1: 미커밋 변경사항 임시 보관 (stash)..."
if ! $GIT diff --quiet || ! $GIT diff --cached --quiet; then
  $GIT stash
  STASHED=true
  log "stash 완료 ✓"
else
  STASHED=false
  info "변경사항 없음 — stash 건너뜀"
fi

# Step 2 — develop → dev push
info "Step 2: develop → dev 브랜치 push..."
$GIT push origin develop:dev 2>/dev/null && log "dev 브랜치 생성 ✓" || warn "develop 브랜치가 없거나 이미 dev가 존재합니다"

# Step 3 — main → prod push
info "Step 3: main → prod 브랜치 push..."
$GIT push origin main:prod 2>/dev/null && log "prod 브랜치 생성 ✓" || warn "main 브랜치가 없거나 이미 prod가 존재합니다"

# Step 4 — 원격 develop, main 삭제
info "Step 4: 원격 develop, main 브랜치 삭제..."
$GIT push origin --delete develop 2>/dev/null && log "원격 develop 삭제 ✓" || warn "원격 develop 브랜치 없음 — 건너뜀"
$GIT push origin --delete main 2>/dev/null && log "원격 main 삭제 ✓" || warn "원격 main 브랜치 없음 — 건너뜀"

# Step 5 — 로컬 브랜치 이름 변경
info "Step 5: 로컬 브랜치 이름 변경 (develop → dev)..."
CURRENT=$($GIT branch --show-current)
if [ "$CURRENT" = "develop" ]; then
  $GIT branch -m develop dev
  log "로컬 브랜치 이름 변경 ✓"
else
  warn "현재 브랜치가 develop이 아닙니다 ($CURRENT) — 이름 변경 건너뜀"
fi

# Step 6 — upstream 재설정
info "Step 6: upstream 재설정..."
$GIT branch --set-upstream-to=origin/dev dev 2>/dev/null && log "upstream → origin/dev ✓" || warn "upstream 재설정 실패 — 수동 확인 필요"

# Step 7 — stash 복원
if [ "$STASHED" = true ]; then
  info "Step 7: stash 복원..."
  $GIT stash pop && log "stash 복원 ✓"
fi

line
echo ""
echo -e "${GREEN}✅ 완료!${NC}"
echo ""
echo -e "${CYAN}GitHub에서 아래 작업을 수동으로 진행해주세요:${NC}"
echo ""
echo "  1. https://github.com/grey-dotcom/local_grey/settings"
echo "     → General → Default branch → dev 로 변경"
echo ""
echo -e "${CYAN}앞으로 배포 명령어:${NC}"
echo ""
echo "  ./deploy/deploy_flutter.sh \"변경 내용\"        ← dev 기본 배포"
echo "  ./deploy/deploy_flutter.sh dev \"변경 내용\"   ← dev 명시 배포"
echo "  ./deploy/deploy_flutter.sh prod \"QA 승인\"    ← prod 배포"
echo ""
line
