import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'dart:math';
import '../models/card_set.dart';
import '../models/flashcard.dart';
import '../services/storage_service.dart';

class MultipleChoiceScreen extends StatefulWidget {
  final CardSet cardSet;
  final List<Flashcard> flashcards;

  const MultipleChoiceScreen({
    super.key,
    required this.cardSet,
    required this.flashcards,
  });

  @override
  State<MultipleChoiceScreen> createState() => _MultipleChoiceScreenState();
}

class _MultipleChoiceScreenState extends State<MultipleChoiceScreen> {
  int _currentIndex = 0;
  int _correctCount = 0;
  int _incorrectCount = 0;
  String? _selectedAnswer;
  bool _showResult = false;
  List<Flashcard> _shuffledCards = [];
  List<String> _currentOptions = [];
  final Random _random = Random();

  @override
  void initState() {
    super.initState();
    _shuffledCards = List.from(widget.flashcards);
    _shuffledCards.shuffle(_random);
    _generateOptions();
  }

  Flashcard get _currentCard => _shuffledCards[_currentIndex];

  void _generateOptions() {
    _currentOptions = [_currentCard.answer];
    
    // Add 3 random wrong answers
    final otherCards = List<Flashcard>.from(widget.flashcards)
      ..removeWhere((c) => c.id == _currentCard.id);
    otherCards.shuffle(_random);
    
    for (var i = 0; i < 3 && i < otherCards.length; i++) {
      _currentOptions.add(otherCards[i].answer);
    }
    
    _currentOptions.shuffle(_random);
  }

  void _selectAnswer(String answer) {
    if (_showResult) return;

    setState(() {
      _selectedAnswer = answer;
      _showResult = true;
      
      if (answer == _currentCard.answer) {
        _correctCount++;
        StorageService.updateCardProgress(_currentCard.id, true);
      } else {
        _incorrectCount++;
        StorageService.updateCardProgress(_currentCard.id, false);
      }
    });
  }

  void _nextQuestion() {
    if (_currentIndex < _shuffledCards.length - 1) {
      setState(() {
        _currentIndex++;
        _selectedAnswer = null;
        _showResult = false;
        _generateOptions();
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
        title: const Text('Quiz Complete!'),
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
                _selectedAnswer = null;
                _showResult = false;
                _correctCount = 0;
                _incorrectCount = 0;
                _shuffledCards.shuffle(_random);
                _generateOptions();
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
        title: Text('${l10n.multipleChoice} - ${widget.cardSet.title}'),
      ),
      body: Column(
        children: [
          LinearProgressIndicator(
            value: (_currentIndex + 1) / _shuffledCards.length,
            backgroundColor: theme.colorScheme.surfaceVariant,
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Card(
                    elevation: 8,
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        _currentCard.question,
                        style: theme.textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  ..._currentOptions.map((option) {
                    final isCorrect = option == _currentCard.answer;
                    final isSelected = option == _selectedAnswer;
                    
                    Color? backgroundColor;
                    if (_showResult) {
                      if (isCorrect) {
                        backgroundColor = Colors.green.withOpacity(0.3);
                      } else if (isSelected && !isCorrect) {
                        backgroundColor = Colors.red.withOpacity(0.3);
                      }
                    } else if (isSelected) {
                      backgroundColor = theme.colorScheme.primaryContainer;
                    }

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _showResult ? null : () => _selectAnswer(option),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: backgroundColor,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: Text(
                            option,
                            style: TextStyle(
                              fontSize: 16,
                              color: _showResult && isCorrect
                                  ? Colors.green
                                  : _showResult && isSelected && !isCorrect
                                      ? Colors.red
                                      : null,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                  if (_showResult)
                    Padding(
                      padding: const EdgeInsets.only(top: 16),
                      child: ElevatedButton(
                        onPressed: _nextQuestion,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 32,
                            vertical: 16,
                          ),
                        ),
                        child: const Text('Next'),
                      ),
                    ),
                ],
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            child: Text(
              '${_currentIndex + 1} / ${_shuffledCards.length}',
              style: theme.textTheme.titleLarge,
            ),
          ),
        ],
      ),
    );
  }
}

