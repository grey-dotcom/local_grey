/// 등록된 보고사항 1건
class ReportEntry {
  final String id;
  final String categoryId;
  final String categoryLabel;
  final String typeId;
  final String typeLabel;
  final List<String> photoDataUrls; // base64 data URLs
  final String text;
  final DateTime createdAt;

  const ReportEntry({
    required this.id,
    required this.categoryId,
    required this.categoryLabel,
    required this.typeId,
    required this.typeLabel,
    required this.photoDataUrls,
    required this.text,
    required this.createdAt,
  });

  ReportEntry copyWith({
    String? categoryId,
    String? categoryLabel,
    String? typeId,
    String? typeLabel,
    List<String>? photoDataUrls,
    String? text,
  }) {
    return ReportEntry(
      id: id,
      categoryId: categoryId ?? this.categoryId,
      categoryLabel: categoryLabel ?? this.categoryLabel,
      typeId: typeId ?? this.typeId,
      typeLabel: typeLabel ?? this.typeLabel,
      photoDataUrls: photoDataUrls ?? this.photoDataUrls,
      text: text ?? this.text,
      createdAt: createdAt,
    );
  }
}
