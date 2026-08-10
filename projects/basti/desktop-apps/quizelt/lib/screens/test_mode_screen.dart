import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'dart:math';
import '../models/card_set.dart';
import '../models/flashcard.dart';
import '../services/storage_service.dart';

class TestModeScreen extends StatefulWidget {
  final CardSet cardSet;
  final List<Flashcard> flashcards;

  const TestModeScreen({
    super.key,
    required this.cardSet,
    required this.flashcards,
  });

  @override
  State<TestModeScreen> createState() => _TestModeScreenState();
}

class _TestModeScreenState extends State<TestModeScreen> {
  int _currentIndex = 0;
  bool _showAnswer = false;
  int _correctCount = 0;
  int _incorrectCount = 0;
  List<Flashcard> _shuffledCards = [];
  final Random _random = Random();

  @override
  void initState() {
    super.initState();
    _shuffledCards = List.from(widget.flashcards);
    _shuffledCards.shuffle(_random);
  }

  Flashcard get _currentCard => _shuffledCards[_currentIndex];

  void _flipCard() {
    setState(() {
      _showAnswer = !_showAnswer;
    });
  }

  void _answerCard(bool isCorrect) {
    if (isCorrect) {
      _correctCount++;
    } else {
      _incorrectCount++;
    }

    StorageService.updateCardProgress(_currentCard.id, isCorrect);

    if (_currentIndex < _shuffledCards.length - 1) {
      setState(() {
        _currentIndex++;
        _showAnswer = false;
      });
    } else {
      _showResults();
    }
  }

  void _showResults() {
    final total = _shuffledCards.length;
    final percentage = ((_correctCount / total) * 100).round();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Test Complete!'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '$percentage%',
              style: const TextStyle(fontSize: 48, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Text('Correct: $_correctCount / $total'),
            Text('Incorrect: $_incorrectCount / $total'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text('Done'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                _currentIndex = 0;
                _showAnswer = false;
                _correctCount = 0;
                _incorrectCount = 0;
                _shuffledCards.shuffle(_random);
              });
            },
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text('${l10n.test} - ${widget.cardSet.title}'),
      ),
      body: Column(
        children: [
          LinearProgressIndicator(
            value: (_currentIndex + 1) / _shuffledCards.length,
            backgroundColor: theme.colorScheme.surfaceVariant,
          ),
          Expanded(
            child: GestureDetector(
              onTap: _flipCard,
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Card(
                    elevation: 8,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Expanded(
                            child: Center(
                              child: Text(
                                _showAnswer ? _currentCard.answer : _currentCard.question,
                                style: theme.textTheme.headlineMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.surfaceVariant,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.keyboard, size: 16),
                                const SizedBox(width: 8),
                                Text(
                                  l10n.pressSpaceOrClick,
                                  style: theme.textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    ElevatedButton.icon(
                      onPressed: _showAnswer
                          ? () => _answerCard(false)
                          : null,
                      icon: const Icon(Icons.close, color: Colors.red),
                      label: Text(l10n.incorrect),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red.withOpacity(0.1),
                        foregroundColor: Colors.red,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 16,
                        ),
                      ),
                    ),
                    Text(
                      '${_currentIndex + 1} / ${_shuffledCards.length}',
                      style: theme.textTheme.titleLarge,
                    ),
                    ElevatedButton.icon(
                      onPressed: _showAnswer
                          ? () => _answerCard(true)
                          : null,
                      icon: const Icon(Icons.check, color: Colors.green),
                      label: Text(l10n.correct),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green.withOpacity(0.1),
                        foregroundColor: Colors.green,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 16,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

