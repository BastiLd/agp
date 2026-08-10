import 'package:hive/hive.dart';

part 'flashcard.g.dart';

@HiveType(typeId: 0)
class Flashcard extends HiveObject {
  @HiveField(0)
  String id;
  
  @HiveField(1)
  String question;
  
  @HiveField(2)
  String answer;
  
  @HiveField(3)
  String? hint;
  
  @HiveField(4)
  String setId;
  
  @HiveField(5)
  int timesStudied;
  
  @HiveField(6)
  int timesCorrect;
  
  @HiveField(7)
  DateTime lastStudied;
  
  @HiveField(8)
  bool isFavorite;

  Flashcard({
    required this.id,
    required this.question,
    required this.answer,
    this.hint,
    required this.setId,
    this.timesStudied = 0,
    this.timesCorrect = 0,
    DateTime? lastStudied,
    this.isFavorite = false,
  }) : lastStudied = lastStudied ?? DateTime.now();

  double get accuracy {
    if (timesStudied == 0) return 0.0;
    return timesCorrect / timesStudied;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'question': question,
      'answer': answer,
      'hint': hint,
      'setId': setId,
      'timesStudied': timesStudied,
      'timesCorrect': timesCorrect,
      'lastStudied': lastStudied.toIso8601String(),
      'isFavorite': isFavorite,
    };
  }

  factory Flashcard.fromJson(Map<String, dynamic> json) {
    return Flashcard(
      id: json['id'] as String,
      question: json['question'] as String,
      answer: json['answer'] as String,
      hint: json['hint'] as String?,
      setId: json['setId'] as String,
      timesStudied: json['timesStudied'] as int? ?? 0,
      timesCorrect: json['timesCorrect'] as int? ?? 0,
      lastStudied: json['lastStudied'] != null
          ? DateTime.parse(json['lastStudied'] as String)
          : DateTime.now(),
      isFavorite: json['isFavorite'] as bool? ?? false,
    );
  }
}

