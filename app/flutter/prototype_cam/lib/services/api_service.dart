import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;

// =============================================================================
// ApiService — 사진 업로드 API 연동 레이어
//
// ── Phase 1: BE 연동 준비 주석 ─────────────────────────────────────────────
//
// [BE 연동 #1] 업로드 API
//   endpoint : POST /api/v1/captures
//   실서버 연동 시: _mockMode = false, _baseUrl = 실제 서버 주소로 교체
//   인증 헤더가 필요한 경우 headers에 Authorization 토큰 추가
//   예: ..headers.addAll({'Authorization': 'Bearer $token', 'Accept': 'application/json'})
//
// [BE 연동 #2] 업로드 응답 JSON 구조
//   BE 개발자가 확정 후 아래 파싱 코드 수정 필요
//   현재 예시 구조: { "id": "...", "url": "...", "item_id": "...", "group_id": "...", "status": "ok" }
//
// [BE 연동 #3] 재시도(재업로드) API
//   정책: 에러 발생 사진은 로컬에 유지하고 사용자가 재시도 가능해야 함
//   선택 A (권장): 동일 endpoint POST /api/v1/captures 재호출 — 멱등성 보장 필요
//   선택 B        : 별도 endpoint POST /api/v1/captures/{id}/retry
//   → BE 팀과 협의 후 capture_provider.dart의 retryUpload() 구현체 완성
//
// [BE 연동 #4] 수행완료 자동 처리 API
//   endpoint : POST /api/v1/tasks/{taskId}/complete
//   트리거   : 모든 필수 사진 업로드 success 확인 후 FE에서 자동 호출
//   또는      : BE가 업로드 완료를 감지해 자동 상태 전환 (웹훅/폴링 방식 협의 필요)
//   → task_list_screen.dart의 _BottomCta에서 연동 예정 (Phase 3)
//
// [BE 연동 #5] 어드민 업로드 사진 상태 조회
//   endpoint : GET /api/v1/tasks/{taskId}/captures
//   용도     : 화면 재진입(리프레시) 시 어드민이 업로드한 사진 여부 확인
//   → 해당 도안을 "재촬영" 상태로 표시 (Phase 3)
//
// [BE 연동 #6] 에러 코드 분류 정책 (BE 팀 확정 필요)
//   재시도 가능  : 네트워크 타임아웃(0), 서버 과부하(503), 게이트웨이 오류(502/504), 요청 시간 초과(408)
//   재시도 불가  : 인증 만료(401), 권한 없음(403), 잘못된 요청(400), 지원하지 않는 파일 형식(415)
//   → ApiException.isRetryable 필드로 FE에서 재시도 버튼 노출 여부 결정
//
// =============================================================================

class ApiService {
  // [BE 연동 #1] 실서버 연동 시 _baseUrl 교체 + _mockMode = false
  static const String _baseUrl = 'https://api.your-backend.com';
  static const bool _mockMode = true;

  ApiService._();
  static final ApiService instance = ApiService._();

  // ── 사진 업로드 ─────────────────────────────────────────────────────────────
  // [BE 연동 #1] endpoint: POST /api/v1/captures
  // 현재 _mockMode=true → 600ms 지연 후 목업 응답 반환
  Future<Map<String, dynamic>> uploadCapture({
    required Uint8List bytes,
    required String itemId,
    required String groupId,
  }) async {
    if (_mockMode) {
      await Future.delayed(const Duration(milliseconds: 600));
      return {
        'id': 'mock_${DateTime.now().millisecondsSinceEpoch}',
        'url': 'https://mock-storage.example.com/$itemId.jpg',
        'item_id': itemId,
        'group_id': groupId,
        'captured_at': DateTime.now().toIso8601String(),
      };
    }

    final uri = Uri.parse('$_baseUrl/api/v1/captures');
    final request = http.MultipartRequest('POST', uri)
      // [BE 연동 #1] 인증 헤더 필요 시 Authorization 추가
      ..headers.addAll({'Accept': 'application/json'})
      ..fields['item_id'] = itemId
      ..fields['group_id'] = groupId
      ..fields['captured_at'] = DateTime.now().toIso8601String()
      ..files.add(
        http.MultipartFile.fromBytes(
          'file',
          bytes,
          filename: '${itemId}_${DateTime.now().millisecondsSinceEpoch}.jpg',
        ),
      );

    try {
      final streamedResponse = await request.send().timeout(
        const Duration(seconds: 30),
      );
      final response = await http.Response.fromStream(streamedResponse);
      if (response.statusCode == 200 || response.statusCode == 201) {
        // [BE 연동 #2] 실제 API 응답 JSON 구조 확정 후 파싱 수정
        try {
          final json = jsonDecode(response.body) as Map<String, dynamic>;
          return {
            'status': 'ok',
            'item_id': json['item_id'] ?? itemId,
            'group_id': json['group_id'] ?? groupId,
            'url': json['url'],
            'id': json['id'],
          };
        } catch (_) {
          return {'status': 'ok', 'item_id': itemId, 'group_id': groupId};
        }
      } else {
        // [BE 연동 #6] 에러 코드별 isRetryable 분류 적용 지점
        throw ApiException(
          code: response.statusCode,
          message: '업로드 실패: ${response.statusCode}',
          isRetryable: _isRetryableStatusCode(response.statusCode),
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      // 네트워크 오류는 재시도 가능으로 분류
      throw ApiException(code: 0, message: '네트워크 오류: $e', isRetryable: true);
    }
  }

  // ── 에러 코드 재시도 가능 여부 판단 ─────────────────────────────────────────
  // [BE 연동 #6] BE 팀 에러 코드 정책 확정 후 이 목록 업데이트
  static bool _isRetryableStatusCode(int code) {
    // 재시도 가능: 네트워크/서버 일시 오류
    const retryable = {0, 408, 429, 500, 502, 503, 504};
    // 재시도 불가: 클라이언트 오류 (400, 401, 403, 415 등)
    return retryable.contains(code);
  }
}

// =============================================================================
// ApiException
// isRetryable: true  → UI에서 "재시도" 버튼 노출
// isRetryable: false → UI에서 "오류" 메시지만 표시 (재시도 버튼 없음)
// [BE 연동 #6] BE 에러 코드 정책 확정 후 _isRetryableStatusCode 업데이트
// =============================================================================
class ApiException implements Exception {
  final int code;
  final String message;
  // [BE 연동 #6] 재시도 가능 여부 — FE UI에서 재시도 버튼 노출에 사용
  final bool isRetryable;

  const ApiException({
    required this.code,
    required this.message,
    this.isRetryable = true, // 기본값: 재시도 가능 (사용자 경험 보호)
  });

  @override
  String toString() => 'ApiException($code, retryable=$isRetryable): $message';
}
