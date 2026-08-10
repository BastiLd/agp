import 'package:hive/hive.dart';

part 'progress.g.dart';

@HiveType(typeId: 3)
class Progress extends HiveObject {
  @HiveField(0)
  String id;
  
  @HiveField(1)
  String userId;
  
  @HiveField(2)
  String setId;
  
  @HiveField(3)
  String cardId;
  
  @HiveField(4)
  int timesStudied;
  
  @HiveField(5)
  int timesCorrect;
  
  @HiveField(6)
  DateTime lastStudied;
  
  @HiveField(7)
  bool isMastered; // Considered mastered if accuracy > 80% and studied > 3 times

  Progress({
    required this.id,
    required this.userId,
    required this.setId,
    required this.cardId,
    this.timesStudied = 0,
    this.timesCorrect = 0,
    DateTime? lastStudied,
    this.isMastered = false,
  }) : lastStudied = lastStudied ?? DateTime.now();

  double get accuracy {
    if (timesStudied == 0) return 0.0;
    return timesCorrect / timesStudied;
  }

  void updateProgress(bool isCorrect) {
    timesStudied++;
    if (isCorrect) {
      timesCorrect++;
    }
    lastStudied = DateTime.now();
    
    // Auto-master if accuracy > 80% and studied at least 3 times
    if (timesStudied >= 3 && accuracy >= 0.8) {
      isMastered = true;
    }
    
    save();
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'setId': setId,
      'cardId': cardId,
      'timesStudied': timesStudied,
      'timesCorrect': timesCorrect,
      'lastStudied': lastStudied.toIso8601String(),
      'isMastered': isMastered,
    };
  }

  factory Progress.fromJson(Map<String, dynamic> json) {
    return Progress(
      id: json['id'] as String,
      userId: json['userId'] as String,
      setId: json['setId'] as String,
      cardId: json['cardId'] as String,
      timesStudied: json['timesStudied'] as int? ?? 0,
      timesCorrect: json['timesCorrect'] as int? ?? 0,
      lastStudied: json['lastStudied'] != null
          ? DateTime.parse(json['lastStudied'] as String)
          : DateTime.now(),
      isMastered: json['isMastered'] as bool? ?? false,
    );
  }
}

