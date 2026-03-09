# prototype_cam 배포 가이드

> Flutter 카메라 모듈 | Keeper 서비스 부속 기능
> GitHub: https://github.com/grey-dotcom/local_grey

---

## 이 모듈은 무엇인가요?

Keeper 서비스 앱의 **카메라 촬영 기능** 모듈입니다.
현재는 독립적으로 동작하는 프로토타입이며,
추후 다른 기능 모듈들과 합쳐져 하나의 완성된 앱이 됩니다.

```
전체 앱 (미래)
├── prototype_cam     ← 지금 이 모듈 (카메라 촬영)
├── [모듈 B]          ← 추후 추가
└── [모듈 C]          ← 추후 추가
```

---

## 파일 구조

```
local_grey/
├── app/flutter/prototype_cam/   ← 이 모듈의 소스코드
├── deploy/
│   ├── deploy_flutter.sh        ← 배포 스크립트 (Deploy Agent 전용)
│   ├── qa_checklist_flutter.md  ← QA 검증 체크리스트
│   ├── deploy.log               ← 배포 이력 (자동 기록)
│   └── LATEST_DEPLOY.txt        ← 최근 배포 정보 (자동 기록)
└── DEPLOY_README.md             ← 이 파일
```

---

## 브랜치 구조

```
GitHub 저장소
├── main      완료된 코드 (QA 승인 필수)
└── develop   개발/검증 중인 코드
```

**규칙:** 모든 코드는 develop 먼저 → QA 검증 → main 순서

---

## 배포 방법 (Deploy Agent가 실행)

```bash
# 터미널에서 프로젝트 루트로 이동
cd /Users/grey/Desktop/local_grey

# develop에 배포 (가장 자주 사용)
./deploy/deploy_flutter.sh develop "변경 내용 설명"

# 배포 현황 확인
./deploy/deploy_flutter.sh status

# 변경된 파일 목록 확인
./deploy/deploy_flutter.sh diff

# QA 승인 후 main에 최종 배포
./deploy/deploy_flutter.sh main "QA 승인 완료 v1.0.x"

# 롤백 (직전 커밋으로 되돌리기)
./deploy/deploy_flutter.sh rollback 1
```

---

## 표준 배포 순서

```
1. 개발자가 코드 수정 완료
         ↓
2. PM이 Deploy Agent에게 배포 요청
         ↓
3. Deploy Agent 실행
   ./deploy/deploy_flutter.sh develop "내용"
   → 파일 감지 → 코드 검증 → GitHub develop push
         ↓
4. QA 채팅에 검증 요청 전달
   (커밋 해시, 변경 내용, GitHub 링크)
         ↓
5. QA 검증 (qa_checklist_flutter.md 기준)
   통과 → QA-APPROVED 코드 발급
   실패 → 롤백 요청
         ↓
6. Deploy Agent가 main 최종 배포
   ./deploy/deploy_flutter.sh main "QA 승인 완료"
```

---

## 개발자 온보딩 (다른 개발자가 받아가는 방법)

```bash
# 1. GitHub에서 클론
git clone https://github.com/grey-dotcom/local_grey.git
cd local_grey/app/flutter/prototype_cam

# 2. 자동 세팅 스크립트 실행 (패키지 설치 등 한 번에 처리)
chmod +x setup.sh
./setup.sh

# 3. 웹에서 실행 확인
flutter run -d chrome --web-port=9005
```

**네이티브(iOS/Android) 개발 시:** `README.md`의 "네이티브 전환 가이드" 참고

---

## QA 채팅 시작 방법

새 Claude 채팅을 열고 `deploy/qa_checklist_flutter.md` 맨 아래의
"QA 채팅 시작 프롬프트"를 복사해서 붙여넣으세요.
