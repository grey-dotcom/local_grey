import 'package:flutter/foundation.dart';
import '../models/report_entry.dart';

class ReportProvider extends ChangeNotifier {
  final List<ReportEntry> _entries = [];

  List<ReportEntry> get entries => List.unmodifiable(_entries);
  bool get hasEntries => _entries.isNotEmpty;

  void add(ReportEntry entry) {
    _entries.add(entry);
    notifyListeners();
  }

  void update(ReportEntry updated) {
    final idx = _entries.indexWhere((e) => e.id == updated.id);
    if (idx >= 0) {
      _entries[idx] = updated;
      notifyListeners();
    }
  }

  void remove(String id) {
    _entries.removeWhere((e) => e.id == id);
    notifyListeners();
  }
}
