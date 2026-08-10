import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'dart:math';
import '../models/card_set.dart';
import '../models/flashcard.dart';
import '../services/storage_service.dart';

class MatchModeScreen extends StatefulWidget {
  final CardSet cardSet;
  final List<Flashcard> flashcards;

  const MatchModeScreen({
    super.key,
    required this.cardSet,
    required this.flashcards,
  });

  @override
  State<MatchModeScreen> createState() => _MatchModeScreenState();
}

class _MatchModeScreenState extends State<MatchModeScreen> {
  List<MatchItem> _items = [];
  MatchItem? _selectedItem;
  int _matchedPairs = 0;
  bool _gameComplete = false;

  @override
  void initState() {
    super.initState();
    _initializeGame();
  }

  void _initializeGame() {
    _items = [];
    final cards = widget.flashcards.take(8).toList(); // Limit to 8 cards for matching
    
    // Create question items
    for (var card in cards) {
      _items.add(MatchItem(
        id: 'q_${card.id}',
        text: card.question,
        type: MatchItemType.question,
        cardId: card.id,
      ));
    }
    
    // Create answer items
    for (var card in cards) {
      _items.add(MatchItem(
        id: 'a_${card.id}',
        text: card.answer,
        type: MatchItemType.answer,
        cardId: card.id,
      ));
    }
    
    _items.shuffle(Random());
    _matchedPairs = 0;
    _gameComplete = false;
  }

  void _selectItem(MatchItem item) {
    if (item.isMatched || item == _selectedItem) return;

    setState(() {
      if (_selectedItem == null) {
        _selectedItem = item;
        item.isSelected = true;
      } else {
        // Check if match
        if (_selectedItem!.cardId == item.cardId &&
            _selectedItem!.type != item.type) {
          // Match found!
          _selectedItem!.isMatched = true;
          item.isMatched = true;
          _selectedItem!.isSelected = false;
          _selectedItem = null;
          _matchedPairs++;
          
          if (_matchedPairs == widget.flashcards.length) {
            _gameComplete = true;
            _showCompletionDialog();
          }
        } else {
          // No match
          _selectedItem!.isSelected = false;
          _selectedItem = null;
        }
      }
    });
  }

  void _showCompletionDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Match Complete!'),
        content: Text('You matched all ${_matchedPairs} pairs!'),
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
                _initializeGame();
              });
            },
            child: const Text('Play Again'),
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
        title: Text('${l10n.match} - ${widget.cardSet.title}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() {
                _initializeGame();
              });
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            child: Text(
              'Matched: $_matchedPairs / ${widget.flashcards.length}',
              style: theme.textTheme.titleLarge,
            ),
          ),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.5,
              ),
              itemCount: _items.length,
              itemBuilder: (context, index) {
                final item = _items[index];
                return _buildMatchCard(item, theme);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMatchCard(MatchItem item, ThemeData theme) {
    Color backgroundColor;
    if (item.isMatched) {
      backgroundColor = Colors.green.withOpacity(0.3);
    } else if (item.isSelected) {
      backgroundColor = theme.colorScheme.primaryContainer;
    } else {
      backgroundColor = theme.cardTheme.color ?? theme.cardColor;
    }

    return InkWell(
      onTap: () => _selectItem(item),
      child: Card(
        color: backgroundColor,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: Text(
              item.text,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontWeight: item.isSelected || item.isMatched
                    ? FontWeight.bold
                    : FontWeight.normal,
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ),
      ),
    );
  }
}

class MatchItem {
  final String id;
  final String text;
  final MatchItemType type;
  final String cardId;
  bool isSelected = false;
  bool isMatched = false;

  MatchItem({
    required this.id,
    required this.text,
    required this.type,
    required this.cardId,
  });
}

enum MatchItemType { question, answer }

