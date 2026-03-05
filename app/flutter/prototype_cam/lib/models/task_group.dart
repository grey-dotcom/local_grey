import 'task_item.dart';

class TaskGroup {
  final String id;
  final String title;
  final int order;
  final List<TaskItem> items;

  const TaskGroup({
    required this.id,
    required this.title,
    required this.order,
    required this.items,
  });

  factory TaskGroup.fromJson(Map<String, dynamic> json) => TaskGroup(
        id: json['id'] as String,
        title: json['title'] as String,
        order: json['order'] as int,
        items: (json['items'] as List)
            .map((e) => TaskItem.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  List<TaskItem> get mandatoryItems => items.where((i) => i.isMandatory).toList();
}
