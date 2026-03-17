class ReportCategory {
  final String id;
  final String label;
  const ReportCategory({required this.id, required this.label});
  factory ReportCategory.fromJson(Map<String, dynamic> j) =>
      ReportCategory(id: j['id'] as String, label: j['label'] as String);
}

class ReportType {
  final String id;
  final String label;
  const ReportType({required this.id, required this.label});
  factory ReportType.fromJson(Map<String, dynamic> j) =>
      ReportType(id: j['id'] as String, label: j['label'] as String);
}
