import 'package:hive/hive.dart';

part 'card_set.g.dart';

@HiveType(typeId: 1)
class CardSet extends HiveObject {
  @HiveField(0)
  String id;
  
  @HiveField(1)
  String title;
  
  @HiveField(2)
  String? description;
  
  @HiveField(3)
  String userId;
  
  @HiveField(4)
  DateTime createdAt;
  
  @HiveField(5)
  DateTime updatedAt;
  
  @HiveField(6)
  bool isFavorite;
  
  @HiveField(7)
  String? folderId;
  
  @HiveField(8)
  String shareCode;

  CardSet({
    required this.id,
    required this.title,
    this.description,
    required this.userId,
    DateTime? createdAt,
    DateTime? updatedAt,
    this.isFavorite = false,
    this.folderId,
    String? shareCode,
  })  : createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now(),
        shareCode = shareCode ?? '';

  int get cardCount {
    // This will be calculated from storage
    return 0;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'userId': userId,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'isFavorite': isFavorite,
      'folderId': folderId,
      'shareCode': shareCode,
    };
  }

  factory CardSet.fromJson(Map<String, dynamic> json) {
    return CardSet(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      userId: json['userId'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      isFavorite: json['isFavorite'] as bool? ?? false,
      folderId: json['folderId'] as String?,
      shareCode: json['shareCode'] as String? ?? '',
    );
  }
}

