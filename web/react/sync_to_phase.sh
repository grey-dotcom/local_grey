#!/bin/bash
# =============================================================================
# sync_to_phase.sh — prototype_dashboard_ts → prototype_dashboard_phase 동기화
# =============================================================================
# 사용법: bash sync_to_phase.sh [phase번호]   예: bash sync_to_phase.sh 1
# [중요] prototype_dashboard_ts 파일을 직접 수정하지 않습니다.
# =============================================================================

PHASE=${1:-1}
SRC="/Users/grey/Desktop/local_grey/web/react/prototype_dashboard_ts"
DST="/Users/grey/Desktop/local_grey/web/react/prototype_dashboard_phase"

echo "========================================"
echo " sync_to_phase.sh — Phase $PHASE 동기화"
echo "========================================"

rm -rf "$DST"
mkdir -p "$DST"

rsync -a \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='out' \
  --exclude='.git' \
  "$SRC/" "$DST/"

echo "[OK] 전체 파일 복사 완료"

if [ "$PHASE" = "1" ]; then
  # 1. 위젯 파일 제거
  rm -f "$DST/src/components/dashboard/FeedWidget.tsx"
  rm -f "$DST/src/components/dashboard/FeedCard.tsx"
  rm -f "$DST/src/components/dashboard/FEED_WIDGET_SPEC.md"
  rm -f "$DST/src/components/dashboard/IssueWidget.tsx"
  rm -f "$DST/src/components/dashboard/IssueCard.tsx"
  rm -f "$DST/src/components/dashboard/ClaimWidget.tsx"
  rm -f "$DST/src/components/dashboard/ClaimCard.tsx"
  echo "[OK] 위젯 파일 제거 완료"

  # 2. page.tsx — Phase 1 전용 파일로 덮어쓰기 (sed 방식 대신 파일 복사)
  cp "$SRC/src/app/(dashboard)/home/page.phase1.tsx" \
     "$DST/src/app/(dashboard)/home/page.tsx"
  echo "[OK] page.tsx Phase 1 전용 파일로 교체 완료"

  # 3. WidgetSelector.tsx — feed/issue/claim 기본값 false
  sed -i '' \
    "s/feed: true, issue: true, claim: true/feed: false, issue: false, claim: false/" \
    "$DST/src/components/dashboard/WidgetSelector.tsx"
  echo "[OK] WidgetSelector.tsx 기본값 수정 완료"

  # 4. package.json — 포트 9006으로 변경
  sed -i '' "s/next dev -p 9004/next dev -p 9006/" "$DST/package.json"
  sed -i '' "s/next start -p 9004/next start -p 9006/" "$DST/package.json"
  echo "[OK] package.json 포트 수정 완료 (9006)"

  # 5. docs — 공개 대상 파일만 public/docs 로 복사, 나머지 전체 삭제
  rm -rf "$DST/docs"
  mkdir -p "$DST/public/docs"
  cp "$SRC/docs/SPEC_AUTH.md"       "$DST/public/docs/"
  cp "$SRC/docs/SPEC_KPI.md"        "$DST/public/docs/"
  cp "$SRC/docs/SPEC_FEED.md"       "$DST/public/docs/"
  cp "$SRC/docs/SPEC_ISSUE.md"      "$DST/public/docs/"
  cp "$SRC/docs/SPEC_CLAIM.md"      "$DST/public/docs/"
  cp "$SRC/docs/STATUS_POLICY.md"   "$DST/public/docs/"
  cp "$SRC/docs/TERM_POLICY.md"     "$DST/public/docs/"
  echo "[OK] 공개 문서 복사 완료 (public/docs)"

  # 6. 내부 관리 문서 제거
  rm -f "$DST/HANDOVER.md"
  rm -f "$DST/HANDOVER_BASE.md"
  rm -f "$DST/CLAUDE.md"
  echo "[OK] 내부 관리 문서 제거 완료"
fi

echo ""
echo "========================================"
echo " 완료: $DST"
echo " 확인: http://localhost:9006 (npm run dev 실행 후)"
echo "========================================"
