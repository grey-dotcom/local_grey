# QA 검증 체크리스트 — prototype_cam (Flutter 카메라 모듈)

> **이 문서는 QA 채팅(별도 Claude)이 사용하는 문서입니다.**
> Deploy Agent가 develop에 push한 뒤, 이 체크리스트를 기준으로 검증합니다.

---

## 역할 요약

| | Deploy Agent (이 채팅) | QA (별도 채팅) |
|---|---|---|
| 역할 | 코드 배포, GitHub push | 코드 검증, 승인/롤백 결정 |
| 권한 | develop/main 배포 | 승인 코드 발급, 롤백 요청 |
| 승인 코드 | 입력받아 main 배포 | `QA-APPROVED` 발급 |

---

## QA 검증 요청 수신 형식

Deploy Agent로부터 아래 형식의 메시지를 받으면 검증 시작:

```
[QA 검증 요청]
모듈: prototype_cam (Flutter 카메라)
커밋: xxxxxxx
브랜치: develop
내용: [변경 내용 설명]
GitHub: https://github.com/grey-dotcom/local_grey/compare/main...develop
```

---

## ✅ 검증 체크리스트

### 1단계 — 변경 범위 확인
```
□ GitHub에서 develop 브랜치 최신 커밋 열기
□ 변경된 파일이 app/flutter/prototype_cam/ 내부에만 있는가?
□ 아래 파일이 실수로 포함되지 않았는가? → 포함 시 즉시 롤백
   - .env (API 키 등 민감 정보)
   - build/ 폴더 내 파일
   - .dart_tool/ 폴더 내 파일
   - node_modules/ (플러터 프로젝트에 있으면 이상함)
□ 커밋 메시지가 실제 변경 내용과 일치하는가?
```

### 2단계 — 코드 변경 내용 확인
```
□ lib/ 폴더 변경 시:
   - main.dart: 앱 시작 방식에 문제없는가?
   - models/: 데이터 구조가 바뀌었다면 기존 기능과 호환되는가?
   - services/api_service.dart: API 주소나 mock 설정이 의도대로인가?
   - services/camera_service.dart: 카메라 관련 로직에 오류 없는가?
   - widgets/: UI 컴포넌트가 단독으로 사용 가능한 구조인가?

□ assets/ 폴더 변경 시:
   - task_data.json: JSON 형식이 올바른가? (그룹>아이템 구조 유지)

□ pubspec.yaml 변경 시:
   - 새 패키지 추가라면 목적이 명확한가?
   - 버전 변경이 있다면 이유가 있는가?

□ setup.sh / README.md 변경 시:
   - 다른 개발자가 읽었을 때 이해할 수 있는가?
```

### 3단계 — "모듈성" 확인 (가장 중요)
```
이 모듈은 나중에 전체 앱에 통합될 예정입니다.
아래 기준으로 반드시 확인하세요.

□ 다른 모듈에 의존하는 코드가 없는가?
   (예: 다른 폴더의 파일을 import하는 코드)
□ API 주소가 하드코딩이 아닌 설정값으로 분리되어 있는가?
□ 화면 크기를 고정값(px)으로 박아놓지 않았는가?
   (다양한 기기에서 사용될 예정)
□ 에러 발생 시 앱 전체가 죽지 않고 해당 모듈만 오류 처리되는가?
```

### 4단계 — 보안 확인
```
□ API 키, 비밀번호 등이 코드에 직접 적혀 있지 않은가?
□ 사용자 정보가 로그(print)로 출력되지 않는가?
□ _mockMode가 실수로 false가 되어 있지 않은가?
   (실서버 연동 전까지 true여야 함)
```

### 5단계 — 최종 판정
```
□ 1~4단계 모두 통과
□ 치명적 이슈 없음
□ develop → main 배포 승인
```

---

## 🔴 즉시 롤백 기준

아래 중 하나라도 해당하면 **무조건 롤백 요청**:

| 상황 | 이유 |
|------|------|
| `.env` 파일 커밋 포함 | API 키 등 민감 정보 노출 위험 |
| `build/` 결과물 포함 | 불필요한 파일, 용량 낭비 |
| 다른 모듈 파일 import | 모듈 독립성 파괴 |
| API 키 하드코딩 | 보안 사고 위험 |
| `_mockMode = false`인데 실서버 미준비 | 실제 사용자 데이터에 영향 |

롤백 요청 방법 → Deploy Agent 채팅에 전달:
```
롤백 요청합니다.
사유: [이유]
명령어: ./deploy_flutter.sh rollback 1
```

---

## 🟢 승인 방법

모든 단계 통과 시 → Deploy Agent 채팅에 아래 전달:

```
✅ QA 승인 완료
검증 일시: [날짜 시간]
승인 코드: QA-APPROVED
특이사항: [없음 또는 내용]
```

Deploy Agent는 이 코드를 받아 main 배포를 실행합니다.

---

## QA 채팅 시작 프롬프트

새 Claude 채팅을 열고 아래를 붙여넣기 하세요:

```
나는 local_grey 프로젝트의 QA 역할이야.

검증 대상: prototype_cam (Flutter 카메라 모듈)
GitHub: https://github.com/grey-dotcom/local_grey
체크리스트 위치: deploy/qa_checklist_flutter.md

내 역할:
- Deploy Agent(다른 Claude 채팅)가 develop 브랜치에 올린 코드를 검증
- qa_checklist_flutter.md의 1~5단계 체크리스트를 수행
- 통과 시: 승인 코드 QA-APPROVED 발급
- 실패 시: 롤백 요청 (사유 포함)
- main 브랜치 직접 수정 권한 없음

검증 요청이 오면 체크리스트를 하나씩 수행하고 결과를 알려줘.
```
