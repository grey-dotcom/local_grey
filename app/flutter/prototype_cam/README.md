# prototype_cam

Keeper 서비스의 현장 촬영 모듈 — Flutter 기반 카메라 기능 프로토타입.  
iOS / Android 네이티브 앱에 임베드되는 부속 기능으로, 기존 Keeper 서비스와 API 연동이 전제됩니다.

---

## 현재 상태 (Web 프로토타입)

| 항목 | 상태 |
|---|---|
| 플랫폼 | Web (Chrome) — 프로토타입 |
| 카메라 | `dart:html` + `getUserMedia` (Web 전용) |
| API 연동 | Mock 모드 (`api_service.dart` → `_mockMode: true`) |
| iOS / Android | 구조 준비 완료, 네이티브 구현 필요 (아래 참고) |

---

## 개발환경 세팅

### 사전 요구사항
- Flutter SDK `>=3.0.0` ([설치 가이드](https://docs.flutter.dev/get-started/install))
- Xcode 15+ (iOS 빌드 시)
- Android Studio / Android SDK (Android 빌드 시)

### 최초 세팅

```bash
# 1. 저장소 클론
git clone <repo-url>
cd prototype_cam

# 2. 패키지 설치
flutter pub get

# 3. iOS CocoaPods (iOS 빌드 시)
cd ios && pod install && cd ..

# 4. Web 실행 (프로토타입 확인)
flutter run -d chrome --web-port=9005
```

---

## 프로젝트 구조

```
lib/
├── main.dart                        # 앱 진입점
├── models/
│   ├── task_group.dart              # 업무 그룹 모델
│   └── task_item.dart               # 업무 도안 모델
├── providers/
│   └── capture_provider.dart        # 촬영 상태 관리 (Provider)
├── screens/
│   └── capture_screen.dart          # 메인 촬영 화면
├── services/
│   ├── camera_service_interface.dart  # 카메라 추상 인터페이스 ★
│   ├── camera_service.dart            # Web 구현 (dart:html)
│   ├── native_camera_service.dart     # Native 구현 스텁 ★ (개발 필요)
│   └── api_service.dart              # REST API 연동
├── utils/
│   └── app_theme.dart               # 공통 테마/색상
└── widgets/
    ├── camera_view.dart             # Web HtmlElementView 래퍼
    ├── guide_card.dart              # 촬영 가이드 카드
    └── task_list_modal.dart         # 업무 목록 모달

assets/
└── task_data.json                   # 업무/도안 목 데이터 (API 연동 전 사용)
```

---

## 네이티브 전환 가이드 (개발자 인수인계)

### ★ 핵심 원칙
카메라 서비스는 `CameraServiceInterface`로 추상화되어 있습니다.  
**Web ↔ Native 전환은 `capture_provider.dart`의 서비스 인스턴스 교체만으로 완료됩니다.**

### Step 1 — `capture_provider.dart` 분기 처리

```dart
import 'package:flutter/foundation.dart' show kIsWeb;
import 'services/camera_service.dart';         // Web
import 'services/native_camera_service.dart';  // Native

// 기존 (Web 전용):
final WebCameraService _cameraService = WebCameraService();

// 변경 후 (분기):
late final CameraServiceInterface _cameraService =
    kIsWeb ? WebCameraService() : NativeCameraService();
```

### Step 2 — `capture_screen.dart` 카메라 뷰 분기

```dart
// Web: HtmlElementView (현재 구현)
if (kIsWeb) {
  return CameraView(key: ValueKey(viewId), viewId: viewId);
}

// Native: CameraPreview 위젯 사용
final nativeService = provider.cameraService as NativeCameraService;
return CameraPreview(nativeService.controller!);
```

### Step 3 — iOS 권한 설정

`ios/Runner/Info.plist`에 추가:

```xml
<key>NSCameraUsageDescription</key>
<string>업무 도안 촬영을 위해 카메라 접근이 필요합니다.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>촬영된 사진 저장을 위해 갤러리 접근이 필요합니다.</string>
```

### Step 4 — Android 권한 설정

`android/app/src/main/AndroidManifest.xml`에 추가:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

`android/app/build.gradle` minSdkVersion 확인:
```gradle
minSdkVersion 21  // camera 패키지 요구사항
```

---

## API 연동

### 현재 상태
`lib/services/api_service.dart`의 `_mockMode = true` 상태.  
실제 서버 연동 시 아래 두 가지만 변경:

```dart
// 1. baseUrl 교체
static const String _baseUrl = 'https://api.your-backend.com'; // 실제 URL로 변경

// 2. mockMode 해제
static const bool _mockMode = false;
```

### 업로드 엔드포인트 스펙

```
POST /api/v1/captures
Content-Type: multipart/form-data

Fields:
  item_id      String   업무 도안 ID
  group_id     String   업무 그룹 ID
  captured_at  String   ISO 8601 (UTC)

File:
  file         JPEG     촬영 이미지

Response 200/201:
  { "id": "...", "url": "https://...", "item_id": "..." }
```

### 인증 (추가 예정)
현재 미구현. Bearer Token 방식 예정:
```dart
headers: {
  'Authorization': 'Bearer $token',
  'Accept': 'application/json',
}
```

---

## 업무 데이터 연동

현재 `assets/task_data.json` 로컬 파일 사용.  
실서버 연동 시 `capture_provider.dart`의 `loadTasks()`를 API 호출로 교체:

```dart
// 현재 (로컬):
final raw = await rootBundle.loadString('assets/task_data.json');

// 변경 후 (API):
final response = await _api.fetchTaskGroups(workOrderId: workOrderId);
```

---

## QA 체크리스트

개발 완료 후 배포 전 아래 항목을 모두 통과해야 합니다.

### 카메라
- [ ] 앱 최초 실행 시 카메라 권한 요청 팝업 표시
- [ ] 권한 거부 후 "다시 시도" → 권한 팝업 재표시
- [ ] 카메라 live 화면 정상 표시 (미촬영 도안)
- [ ] 촬영 완료 도안: 카메라 live 위에 스틸컷 오버레이
- [ ] 재촬영 버튼 탭: 스틸컷 사라지고 live 전환
- [ ] 촬영 후 자동으로 다음 도안 이동
- [ ] 이전/다음 스와이프 시 카메라 live 유지

### 업로드
- [ ] 촬영 직후 업로드 인디케이터 표시
- [ ] 업로드 성공 시 썸네일 ✓ 표시
- [ ] 업로드 실패 시 썸네일 ✗ 표시
- [ ] 네트워크 오류 시 에러 메시지 노출

### UI / 반응형
- [ ] 다양한 화면 크기에서 레이아웃 깨짐 없음
- [ ] 모달 열기/닫기 정상 동작
- [ ] 촬영 결과 프리뷰 핀치줌 동작

---

## 클론 후 정리 필요 항목

저장소 클론 후 아래 파일을 삭제해야 합니다 (이미 내용은 비워진 상태, 실제 파일 제거 필요):

```bash
git rm lib/widgets/shutter_button.dart     # _ShutterButton (private)으로 대체됨
git rm lib/widgets/pagination_indicator.dart  # guide_card.dart에 인라인 통합됨
git rm -r assets/fonts/   # CDN 폰트 사용 (로컬 파일 없음)
git rm -r assets/images/  # 미사용
git rm test/widget_test.dart  # 형식적 스모크 테스트, 실 검증 없음
git commit -m "chore: remove unused files"
```

---

## 브랜치 전략 (제안)

```
main          프로덕션
develop       통합 개발
feature/web-proto     Web 프로토타입 (현재)
feature/ios-camera    iOS 네이티브 카메라 구현
feature/android-camera  Android 네이티브 카메라 구현
feature/api-integration  실서버 API 연동
```

---

## 문의

PM: [담당자 연락처]  
BE: [BE 개발자 연락처]
