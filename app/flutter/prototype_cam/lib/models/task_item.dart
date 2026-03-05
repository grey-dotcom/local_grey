class TaskItem {
  final String id;
  final int order;
  final String title;
  final String contents;
  final bool isMandatory;

  const TaskItem({
    required this.id,
    required this.order,
    required this.title,
    required this.contents,
    required this.isMandatory,
  });

  factory TaskItem.fromJson(Map<String, dynamic> json) => TaskItem(
        id: json['id'] as String,
        order: json['order'] as int,
        title: json['title'] as String,
        contents: json['contents'] as String,
        isMandatory: json['isMandatory'] as bool,
      );
}
