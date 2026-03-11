class AppConfig {
  final String branch;
  final String building;
  final String floor;
  final String roomName;
  final String accessCode; // 매 진입 시 난수 생성 — JSON에서는 미포함

  const AppConfig({
    required this.branch,
    required this.building,
    required this.floor,
    required this.roomName,
    required this.accessCode,
  });

  /// 헤더 표시용 전체 이름: "명동점 A동 201호"
  String get displayTitle => '$branch $building $roomName';

  factory AppConfig.fromJson(Map<String, dynamic> json, {required String accessCode}) {
    final p = json['property'] as Map<String, dynamic>;
    return AppConfig(
      branch: p['branch'] as String,
      building: p['building'] as String,
      floor: p['floor'] as String,
      roomName: p['roomName'] as String,
      accessCode: accessCode,
    );
  }
}
