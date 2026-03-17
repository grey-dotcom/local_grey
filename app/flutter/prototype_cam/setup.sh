#!/bin/bash
# prototype_cam 개발환경 세팅 스크립트
# 네이티브 개발자가 클론 후 최초 1회 실행

set -e

echo "=== prototype_cam 세팅 시작 ==="

# 1. Flutter 버전 확인
echo "\n[1/5] Flutter 버전 확인..."
flutter --version

# 2. 패키지 설치
echo "\n[2/5] flutter pub get..."
flutter pub get

# 3. iOS / Android 플랫폼 폴더 생성 (없는 경우)
if [ ! -d "ios" ]; then
  echo "\n[3/5] iOS 플랫폼 폴더 생성..."
  flutter create --platforms=ios .
else
  echo "\n[3/5] iOS 폴더 이미 존재, 건너뜀"
fi

if [ ! -d "android" ]; then
  echo "\n[4/5] Android 플랫폼 폴더 생성..."
  flutter create --platforms=android .
else
  echo "\n[4/5] Android 폴더 이미 존재, 건너뜀"
fi

# 4. iOS CocoaPods
if [ -d "ios" ]; then
  echo "\n[5/5] iOS CocoaPods 설치..."
  cd ios && pod install && cd ..
fi

echo "\n=== 세팅 완료 ==="
echo ""
echo "실행 방법:"
echo "  Web:     flutter run -d chrome --web-port=9005"
echo "  iOS:     flutter run -d <iPhone device id>"
echo "  Android: flutter run -d <Android device id>"
echo ""
echo "네이티브 카메라 구현 전 필독: README.md > 네이티브 전환 가이드"
