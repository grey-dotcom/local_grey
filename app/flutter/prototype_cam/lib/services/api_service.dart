import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;

class ApiService {
  static const String _baseUrl = 'https://api.your-backend.com';
  static const bool _mockMode = true;

  ApiService._();
  static final ApiService instance = ApiService._();

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
        // [BE 인수인계] 실제 API 응답 JSON 구조에 맞춰 파싱 필요.
        // 현재는 로컸 인지용으로 최소 필드만 반환.
        // 예시 응답: { "id": "...", "url": "...", "item_id": "...", "group_id": "..." }
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
          // 응답 본문 파싱 실패 시 기본값 반환 (업로드 성공 자체는 유지)
          return {'status': 'ok', 'item_id': itemId, 'group_id': groupId};
        }
      } else {
        throw ApiException(code: response.statusCode, message: '업로드 실패: ${response.statusCode}');
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(code: 0, message: '네트워크 오류: $e');
    }
  }
}

class ApiException implements Exception {
  final int code;
  final String message;
  const ApiException({required this.code, required this.message});

  @override
  String toString() => 'ApiException($code): $message';
}
