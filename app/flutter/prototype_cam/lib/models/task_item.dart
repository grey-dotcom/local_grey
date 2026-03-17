class TaskItem {
  final String id;
  final int order;
  final String title;
  final String contents;
  final bool isMandatory;
  final String? guideImageUrl;
  final String? instructions;

  const TaskItem({
    required this.id,
    required this.order,
    required this.title,
    required this.contents,
    required this.isMandatory,
    this.guideImageUrl,
    this.instructions,
  });

  /// 가이드 사진, title, 지시사항 중 하나라도 있으면 가이드 활성
  bool get hasGuide =>
      (guideImageUrl != null && guideImageUrl!.isNotEmpty) ||
      (instructions != null && instructions!.isNotEmpty);

  factory TaskItem.fromJson(Map<String, dynamic> json) => TaskItem(
        id: json['id'] as String,
        order: json['order'] as int,
        title: json['title'] as String,
        contents: json['contents'] as String,
        isMandatory: json['isMandatory'] as bool,
        guideImageUrl: json['guideImageUrl'] as String?,
        instructions: json['instructions'] as String?,
      );
}
