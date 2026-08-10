import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../models/flashcard.dart';
import '../models/card_set.dart';
import '../models/user.dart';
import '../models/progress.dart';

class StorageService {
  static late Box<CardSet> _cardSetsBox;
  static late Box<Flashcard> _flashcardsBox;
  static late Box<User> _usersBox;
  static late Box<Progress> _progressBox;
  static late Box<String> _settingsBox;

  static Future<void> init() async {
    _cardSetsBox = await Hive.openBox<CardSet>('cardSets');
    _flashcardsBox = await Hive.openBox<Flashcard>('flashcards');
    _usersBox = await Hive.openBox<User>('users');
    _progressBox = await Hive.openBox<Progress>('progress');
    _settingsBox = await Hive.openBox<String>('settings');
  }

  // User operations
  static String? getCurrentUserId() {
    return _settingsBox.get('currentUserId');
  }

  static User? getCurrentUser() {
    final userId = getCurrentUserId();
    if (userId == null) return null;
    return _usersBox.get(userId);
  }

  static Future<void> setCurrentUser(String userId) async {
    await _settingsBox.put('currentUserId', userId);
  }

  static Future<void> logout() async {
    await _settingsBox.delete('currentUserId');
  }

  static Future<User?> createUser({
    required String username,
    required String email,
    required String password,
    String accountType = 'Student',
  }) async {
    // Check if username or email already exists
    for (var user in _usersBox.values) {
      if (user.username == username || user.email == email) {
        return null; // User already exists
      }
    }

    final userId = _generateId();
    final hashedPassword = _hashPassword(password);
    
    final user = User(
      id: userId,
      username: username,
      email: email,
      password: hashedPassword,
      accountType: accountType,
    );

    await _usersBox.put(userId, user);
    await setCurrentUser(userId);
    return user;
  }

  static User? login(String usernameOrEmail, String password) {
    final hashedPassword = _hashPassword(password);
    
    for (var user in _usersBox.values) {
      if ((user.username == usernameOrEmail || user.email == usernameOrEmail) &&
          user.password == hashedPassword) {
        setCurrentUser(user.id);
        return user;
      }
    }
    return null;
  }

  static Future<void> updateUser(User user) async {
    await _usersBox.put(user.id, user);
  }

  // CardSet operations
  static List<CardSet> getAllCardSets() {
    final userId = getCurrentUserId();
    if (userId == null) return [];
    
    return _cardSetsBox.values
        .where((set) => set.userId == userId)
        .toList()
      ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
  }

  static CardSet? getCardSet(String setId) {
    return _cardSetsBox.get(setId);
  }

  static Future<CardSet> createCardSet({
    required String title,
    String? description,
    String? folderId,
  }) async {
    final userId = getCurrentUserId();
    if (userId == null) throw Exception('No user logged in');

    final setId = _generateId();
    final shareCode = _generateShareCode();
    
    final cardSet = CardSet(
      id: setId,
      title: title,
      description: description,
      userId: userId,
      folderId: folderId,
      shareCode: shareCode,
    );

    await _cardSetsBox.put(setId, cardSet);
    return cardSet;
  }

  static Future<void> updateCardSet(CardSet cardSet) async {
    cardSet.updatedAt = DateTime.now();
    await _cardSetsBox.put(cardSet.id, cardSet);
  }

  static Future<void> deleteCardSet(String setId) async {
    // Delete all flashcards in the set
    final flashcards = getFlashcardsBySet(setId);
    for (var card in flashcards) {
      await _flashcardsBox.delete(card.id);
    }
    
    // Delete all progress for the set
    final progressList = getProgressBySet(setId);
    for (var progress in progressList) {
      await _progressBox.delete(progress.id);
    }
    
    await _cardSetsBox.delete(setId);
  }

  static CardSet? importCardSet(String shareCode) {
    for (var set in _cardSetsBox.values) {
      if (set.shareCode == shareCode) {
        return set;
      }
    }
    return null;
  }

  // Flashcard operations
  static List<Flashcard> getFlashcardsBySet(String setId) {
    return _flashcardsBox.values
        .where((card) => card.setId == setId)
        .toList();
  }

  static Flashcard? getFlashcard(String cardId) {
    return _flashcardsBox.get(cardId);
  }

  static Future<Flashcard> createFlashcard({
    required String setId,
    required String question,
    required String answer,
    String? hint,
  }) async {
    final cardId = _generateId();
    
    final flashcard = Flashcard(
      id: cardId,
      question: question,
      answer: answer,
      hint: hint,
      setId: setId,
    );

    await _flashcardsBox.put(cardId, flashcard);
    
    // Update card set's updatedAt
    final cardSet = getCardSet(setId);
    if (cardSet != null) {
      await updateCardSet(cardSet);
    }
    
    return flashcard;
  }

  static Future<void> updateFlashcard(Flashcard flashcard) async {
    await _flashcardsBox.put(flashcard.id, flashcard);
    
    // Update card set's updatedAt
    final cardSet = getCardSet(flashcard.setId);
    if (cardSet != null) {
      await updateCardSet(cardSet);
    }
  }

  static Future<void> deleteFlashcard(String cardId) async {
    final flashcard = getFlashcard(cardId);
    if (flashcard != null) {
      await _flashcardsBox.delete(cardId);
      
      // Delete progress for this card
      final progressList = getProgressByCard(cardId);
      for (var progress in progressList) {
        await _progressBox.delete(progress.id);
      }
      
      // Update card set's updatedAt
      final cardSet = getCardSet(flashcard.setId);
      if (cardSet != null) {
        await updateCardSet(cardSet);
      }
    }
  }

  // Progress operations
  static List<Progress> getProgressBySet(String setId) {
    final userId = getCurrentUserId();
    if (userId == null) return [];
    
    return _progressBox.values
        .where((p) => p.userId == userId && p.setId == setId)
        .toList();
  }

  static List<Progress> getProgressByCard(String cardId) {
    final userId = getCurrentUserId();
    if (userId == null) return [];
    
    return _progressBox.values
        .where((p) => p.userId == userId && p.cardId == cardId)
        .toList();
  }

  static Progress? getProgress(String cardId) {
    final userId = getCurrentUserId();
    if (userId == null) return null;
    
    try {
      return _progressBox.values.firstWhere(
        (p) => p.userId == userId && p.cardId == cardId,
      );
    } catch (e) {
      return null;
    }
  }

  static Future<Progress> updateCardProgress(String cardId, bool isCorrect) async {
    final userId = getCurrentUserId();
    if (userId == null) throw Exception('No user logged in');
    
    final flashcard = getFlashcard(cardId);
    if (flashcard == null) throw Exception('Flashcard not found');
    
    Progress progress;
    try {
      progress = _progressBox.values.firstWhere(
        (p) => p.userId == userId && p.cardId == cardId,
      );
    } catch (e) {
      // Create new progress entry
      progress = Progress(
        id: _generateId(),
        userId: userId,
        setId: flashcard.setId,
        cardId: cardId,
      );
    }
    
    progress.updateProgress(isCorrect);
    
    // Also update flashcard stats
    flashcard.timesStudied++;
    if (isCorrect) {
      flashcard.timesCorrect++;
    }
    flashcard.lastStudied = DateTime.now();
    await updateFlashcard(flashcard);
    
    await _progressBox.put(progress.id, progress);
    return progress;
  }

  // Share/Export operations
  static String exportCardSet(String setId) {
    final cardSet = getCardSet(setId);
    if (cardSet == null) throw Exception('Card set not found');
    
    final flashcards = getFlashcardsBySet(setId);
    
    final exportData = {
      'cardSet': cardSet.toJson(),
      'flashcards': flashcards.map((c) => c.toJson()).toList(),
    };
    
    return jsonEncode(exportData);
  }

  static Future<CardSet?> importCardSetFromJson(String jsonString) async {
    try {
      final data = jsonDecode(jsonString) as Map<String, dynamic>;
      final cardSetData = data['cardSet'] as Map<String, dynamic>;
      final flashcardsData = data['flashcards'] as List<dynamic>;
      
      final userId = getCurrentUserId();
      if (userId == null) throw Exception('No user logged in');
      
      // Create new card set
      final newSetId = _generateId();
      final cardSet = CardSet(
        id: newSetId,
        title: cardSetData['title'] as String,
        description: cardSetData['description'] as String?,
        userId: userId,
        shareCode: _generateShareCode(),
      );
      
      await _cardSetsBox.put(newSetId, cardSet);
      
      // Import flashcards
      for (var cardData in flashcardsData) {
        final flashcard = Flashcard.fromJson(cardData as Map<String, dynamic>);
        flashcard.id = _generateId();
        flashcard.setId = newSetId;
        await _flashcardsBox.put(flashcard.id, flashcard);
      }
      
      return cardSet;
    } catch (e) {
      return null;
    }
  }

  // Utility functions
  static String _generateId() {
    return DateTime.now().millisecondsSinceEpoch.toString() +
        (1000 + (9999 - 1000) * (DateTime.now().microsecond / 1000000)).round().toString();
  }

  static String _generateShareCode() {
    final random = DateTime.now().millisecondsSinceEpoch.toString();
    final bytes = utf8.encode(random);
    final digest = sha256.convert(bytes);
    return digest.toString().substring(0, 8).toUpperCase();
  }

  static String _hashPassword(String password) {
    final bytes = utf8.encode(password);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }
}

