import 'package:hive/hive.dart';

part 'user.g.dart';

@HiveType(typeId: 2)
class User extends HiveObject {
  @HiveField(0)
  String id;
  
  @HiveField(1)
  String username;
  
  @HiveField(2)
  String email;
  
  @HiveField(3)
  String password; // In production, this should be hashed
  
  @HiveField(4)
  bool isPremium;
  
  @HiveField(5)
  DateTime? premiumExpiry;
  
  @HiveField(6)
  String accountType; // 'Student' or 'Teacher'
  
  @HiveField(7)
  String? schoolInfo;
  
  @HiveField(8)
  int profilePictureIndex;
  
  @HiveField(9)
  DateTime createdAt;
  
  @HiveField(10)
  Map<String, bool> unlockedFeatures; // Feature -> unlocked via ad

  User({
    required this.id,
    required this.username,
    required this.email,
    required this.password,
    this.isPremium = false,
    this.premiumExpiry,
    this.accountType = 'Student',
    this.schoolInfo,
    this.profilePictureIndex = 0,
    DateTime? createdAt,
    Map<String, bool>? unlockedFeatures,
  })  : createdAt = createdAt ?? DateTime.now(),
        unlockedFeatures = unlockedFeatures ?? {};

  bool get hasActivePremium {
    if (isPremium && premiumExpiry != null) {
      return DateTime.now().isBefore(premiumExpiry!);
    }
    return isPremium;
  }

  bool isFeatureUnlocked(String feature) {
    return hasActivePremium || (unlockedFeatures[feature] ?? false);
  }

  void unlockFeatureViaAd(String feature) {
    unlockedFeatures[feature] = true;
    save();
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'password': password,
      'isPremium': isPremium,
      'premiumExpiry': premiumExpiry?.toIso8601String(),
      'accountType': accountType,
      'schoolInfo': schoolInfo,
      'profilePictureIndex': profilePictureIndex,
      'createdAt': createdAt.toIso8601String(),
      'unlockedFeatures': unlockedFeatures,
    };
  }

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      username: json['username'] as String,
      email: json['email'] as String,
      password: json['password'] as String,
      isPremium: json['isPremium'] as bool? ?? false,
      premiumExpiry: json['premiumExpiry'] != null
          ? DateTime.parse(json['premiumExpiry'] as String)
          : null,
      accountType: json['accountType'] as String? ?? 'Student',
      schoolInfo: json['schoolInfo'] as String?,
      profilePictureIndex: json['profilePictureIndex'] as int? ?? 0,
      createdAt: DateTime.parse(json['createdAt'] as String),
      unlockedFeatures: Map<String, bool>.from(
        json['unlockedFeatures'] as Map? ?? {},
      ),
    );
  }
}

