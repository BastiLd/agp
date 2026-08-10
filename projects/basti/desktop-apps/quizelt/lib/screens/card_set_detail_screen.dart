import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../models/card_set.dart';
import '../models/flashcard.dart';
import '../services/storage_service.dart';
import 'flashcard_edit_screen.dart';
import 'study_mode_screen.dart';
import 'test_mode_screen.dart';
import 'match_mode_screen.dart';
import 'multiple_choice_screen.dart';

class CardSetDetailScreen extends StatefulWidget {
  final CardSet cardSet;

  const CardSetDetailScreen({super.key, required this.cardSet});

  @override
  State<CardSetDetailScreen> createState() => _CardSetDetailScreenState();
}

class _CardSetDetailScreenState extends State<CardSetDetailScreen> {
  List<Flashcard> _flashcards = [];

  @override
  void initState() {
    super.initState();
    _loadFlashcards();
  }

  void _loadFlashcards() {
    setState(() {
      _flashcards = StorageService.getFlashcardsBySet(widget.cardSet.id);
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.cardSet.title,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            if (widget.cardSet.description != null)
              Text(
                widget.cardSet.description!,
                style: theme.textTheme.bodySmall,
              ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(widget.cardSet.isFavorite ? Icons.bookmark : Icons.bookmark_border),
            onPressed: () {
              setState(() {
                widget.cardSet.isFavorite = !widget.cardSet.isFavorite;
                StorageService.updateCardSet(widget.cardSet);
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () => _showShareDialog(context, l10n),
          ),
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: () => _showOptionsMenu(context, l10n),
          ),
        ],
      ),
      body: Column(
        children: [
          // Study mode selection
          Container(
            padding: const EdgeInsets.all(16),
            child: GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 3,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.5,
              children: [
                _buildModeButton(
                  context,
                  l10n.flashcards,
                  Icons.style,
                  Colors.blue,
                  () => _navigateToStudyMode('flashcards'),
                ),
                _buildModeButton(
                  context,
                  l10n.study,
                  Icons.refresh,
                  Colors.green,
                  () => _navigateToStudyMode('learn'),
                ),
                _buildModeButton(
                  context,
                  l10n.test,
                  Icons.checklist,
                  Colors.orange,
                  () => _navigateToTestMode(),
                ),
                _buildModeButton(
                  context,
                  l10n.multipleChoice,
                  Icons.grid_view,
                  Colors.purple,
                  () => _navigateToMultipleChoice(),
                ),
                _buildModeButton(
                  context,
                  'Blast',
                  Icons.rocket_launch,
                  Colors.red,
                  () {
                    // TODO: Implement Blast mode
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Blast mode coming soon!')),
                    );
                  },
                ),
                _buildModeButton(
                  context,
                  l10n.match,
                  Icons.swap_horiz,
                  Colors.teal,
                  () => _navigateToMatchMode(),
                ),
              ],
            ),
          ),
          const Divider(),
          // Cards list
          Expanded(
            child: _flashcards.isEmpty
                ? _buildEmptyState(context, l10n)
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _flashcards.length,
                    itemBuilder: (context, index) {
                      final card = _flashcards[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            child: Text('${index + 1}'),
                          ),
                          title: Text(card.question),
                          subtitle: Text(
                            card.answer,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (card.isFavorite)
                                const Icon(Icons.star, color: Colors.amber, size: 20),
                              IconButton(
                                icon: const Icon(Icons.edit),
                                onPressed: () => _editCard(card),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete),
                                onPressed: () => _deleteCard(card, l10n),
                              ),
                            ],
                          ),
                          onTap: () => _editCard(card),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _addCard(),
        icon: const Icon(Icons.add),
        label: Text(l10n.addCard),
      ),
    );
  }

  Widget _buildModeButton(
    BuildContext context,
    String label,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context, AppLocalizations l10n) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.style_outlined,
            size: 80,
            color: Theme.of(context).colorScheme.primary.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            l10n.noCards,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            l10n.addFirstCard,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }

  void _addCard() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => FlashcardEditScreen(
          cardSet: widget.cardSet,
        ),
      ),
    );
    if (result == true) {
      _loadFlashcards();
    }
  }

  void _editCard(Flashcard card) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => FlashcardEditScreen(
          cardSet: widget.cardSet,
          flashcard: card,
        ),
      ),
    );
    if (result == true) {
      _loadFlashcards();
    }
  }

  void _deleteCard(Flashcard card, AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.delete),
        content: Text('Are you sure you want to delete this card?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(l10n.cancel),
          ),
          TextButton(
            onPressed: () {
              StorageService.deleteFlashcard(card.id);
              _loadFlashcards();
              Navigator.pop(context);
            },
            child: Text(l10n.delete, style: const TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _navigateToStudyMode(String mode) {
    if (_flashcards.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add cards first to start studying')),
      );
      return;
    }
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => StudyModeScreen(
          cardSet: widget.cardSet,
          flashcards: _flashcards,
          mode: mode,
        ),
      ),
    );
  }

  void _navigateToTestMode() {
    if (_flashcards.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add cards first to start testing')),
      );
      return;
    }
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => TestModeScreen(
          cardSet: widget.cardSet,
          flashcards: _flashcards,
        ),
      ),
    );
  }

  void _navigateToMatchMode() {
    if (_flashcards.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add cards first to start matching')),
      );
      return;
    }
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MatchModeScreen(
          cardSet: widget.cardSet,
          flashcards: _flashcards,
        ),
      ),
    );
  }

  void _navigateToMultipleChoice() {
    if (_flashcards.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add cards first to start quiz')),
      );
      return;
    }
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MultipleChoiceScreen(
          cardSet: widget.cardSet,
          flashcards: _flashcards,
        ),
      ),
    );
  }

  void _showShareDialog(BuildContext context, AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.shareCode),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              widget.cardSet.shareCode,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () {
                // TODO: Copy to clipboard
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('${l10n.shareCode} copied!')),
                );
              },
              icon: const Icon(Icons.copy),
              label: Text(l10n.copyCode),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(l10n.cancel),
          ),
        ],
      ),
    );
  }

  void _showOptionsMenu(BuildContext context, AppLocalizations l10n) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.edit),
              title: Text(l10n.edit),
              onTap: () {
                Navigator.pop(context);
                // TODO: Edit card set
              },
            ),
            ListTile(
              leading: const Icon(Icons.import_export),
              title: Text(l10n.export),
              onTap: () {
                Navigator.pop(context);
                _exportCardSet(context, l10n);
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete, color: Colors.red),
              title: Text(l10n.delete, style: const TextStyle(color: Colors.red)),
              onTap: () {
                Navigator.pop(context);
                _deleteCardSet(context, l10n);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _exportCardSet(BuildContext context, AppLocalizations l10n) {
    final exportData = StorageService.exportCardSet(widget.cardSet.id);
    // TODO: Use share_plus to share the export data
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('${l10n.export} successful')),
    );
  }

  void _deleteCardSet(BuildContext context, AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.delete),
        content: Text('Are you sure you want to delete "${widget.cardSet.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(l10n.cancel),
          ),
          TextButton(
            onPressed: () {
              StorageService.deleteCardSet(widget.cardSet.id);
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: Text(l10n.delete, style: const TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}

