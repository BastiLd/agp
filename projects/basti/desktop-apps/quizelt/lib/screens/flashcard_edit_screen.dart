import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../models/card_set.dart';
import '../models/flashcard.dart';
import '../services/storage_service.dart';

class FlashcardEditScreen extends StatefulWidget {
  final CardSet cardSet;
  final Flashcard? flashcard;

  const FlashcardEditScreen({
    super.key,
    required this.cardSet,
    this.flashcard,
  });

  @override
  State<FlashcardEditScreen> createState() => _FlashcardEditScreenState();
}

class _FlashcardEditScreenState extends State<FlashcardEditScreen> {
  final _formKey = GlobalKey<FormState>();
  final _questionController = TextEditingController();
  final _answerController = TextEditingController();
  final _hintController = TextEditingController();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.flashcard != null) {
      _questionController.text = widget.flashcard!.question;
      _answerController.text = widget.flashcard!.answer;
      _hintController.text = widget.flashcard!.hint ?? '';
    }
  }

  @override
  void dispose() {
    _questionController.dispose();
    _answerController.dispose();
    _hintController.dispose();
    super.dispose();
  }

  Future<void> _saveFlashcard() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      if (widget.flashcard != null) {
        // Update existing card
        widget.flashcard!.question = _questionController.text.trim();
        widget.flashcard!.answer = _answerController.text.trim();
        widget.flashcard!.hint = _hintController.text.trim().isEmpty
            ? null
            : _hintController.text.trim();
        await StorageService.updateFlashcard(widget.flashcard!);
      } else {
        // Create new card
        await StorageService.createFlashcard(
          setId: widget.cardSet.id,
          question: _questionController.text.trim(),
          answer: _answerController.text.trim(),
          hint: _hintController.text.trim().isEmpty
              ? null
              : _hintController.text.trim(),
        );
      }

      if (mounted) {
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving card: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isEditing = widget.flashcard != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? l10n.edit : l10n.addCard),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _saveFlashcard,
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(l10n.save),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _questionController,
              decoration: InputDecoration(
                labelText: l10n.question,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
              ),
              textCapitalization: TextCapitalization.sentences,
              maxLines: 3,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter a question';
                }
                return null;
              },
              autofocus: !isEditing,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _answerController,
              decoration: InputDecoration(
                labelText: l10n.answer,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
              ),
              textCapitalization: TextCapitalization.sentences,
              maxLines: 3,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter an answer';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _hintController,
              decoration: InputDecoration(
                labelText: l10n.hint,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
                helperText: 'Optional',
              ),
              textCapitalization: TextCapitalization.sentences,
              maxLines: 2,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isLoading ? null : _saveFlashcard,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(l10n.save),
            ),
          ],
        ),
      ),
    );
  }
}

