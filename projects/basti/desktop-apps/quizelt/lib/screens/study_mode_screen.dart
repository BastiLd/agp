import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'dart:math';
import '../models/card_set.dart';
import '../models/flashcard.dart';
import '../services/storage_service.dart';

class StudyModeScreen extends StatefulWidget {
  final CardSet cardSet;
  final List<Flashcard> flashcards;
  final String mode;

  const StudyModeScreen({
    super.key,
    required this.cardSet,
    required this.flashcards,
    this.mode = 'flashcards',
  });

  @override
  State<StudyModeScreen> createState() => _StudyModeScreenState();
}

class _StudyModeScreenState extends State<StudyModeScreen> {
  int _currentIndex = 0;
  bool _showAnswer = false;
  bool _showHint = false;
  bool _trackProgress = true;
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

  void _nextCard(bool isCorrect) {
    if (_trackProgress) {
      StorageService.updateCardProgress(_currentCard.id, isCorrect);
    }

    if (_currentIndex < _shuffledCards.length - 1) {
      setState(() {
        _currentIndex++;
        _showAnswer = false;
        _showHint = false;
      });
    } else {
      // Finished all cards
      _showCompletionDialog();
    }
  }

  void _showCompletionDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Completed!'),
        content: Text('You have studied all ${_shuffledCards.length} cards.'),
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
                _showHint = false;
                _shuffledCards.shuffle(_random);
              });
            },
            child: const Text('Study Again'),
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
        title: Text(widget.cardSet.title),
        actions: [
          IconButton(
            icon: const Icon(Icons.shuffle),
            onPressed: () {
              setState(() {
                _shuffledCards.shuffle(_random);
                _currentIndex = 0;
                _showAnswer = false;
                _showHint = false;
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              // TODO: Show settings
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Progress bar
          LinearProgressIndicator(
            value: (_currentIndex + 1) / _shuffledCards.length,
            backgroundColor: theme.colorScheme.surfaceVariant,
          ),
          // Card display
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
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              if (_currentCard.hint != null)
                                TextButton.icon(
                                  onPressed: () {
                                    setState(() => _showHint = !_showHint);
                                  },
                                  icon: const Icon(Icons.lightbulb_outline),
                                  label: Text(l10n.showHint),
                                )
                              else
                                const SizedBox.shrink(),
                              IconButton(
                                icon: const Icon(Icons.volume_up),
                                onPressed: () {
                                  // TODO: Text-to-speech
                                },
                              ),
                            ],
                          ),
                          if (_showHint && _currentCard.hint != null)
                            Container(
                              margin: const EdgeInsets.only(bottom: 16),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: theme.colorScheme.primaryContainer,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                _currentCard.hint!,
                                style: theme.textTheme.bodyMedium,
                              ),
                            ),
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
          // Controls
          Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  children: [
                    Text(l10n.trackProgress),
                    const SizedBox(width: 8),
                    Switch(
                      value: _trackProgress,
                      onChanged: (value) {
                        setState(() => _trackProgress = value);
                      },
                    ),
                  ],
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    ElevatedButton.icon(
                      onPressed: _showAnswer
                          ? () => _nextCard(false)
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
                          ? () => _nextCard(true)
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

