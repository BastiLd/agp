import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import '../services/storage_service.dart';
import '../services/theme_service.dart';
import '../models/card_set.dart';
import 'card_set_detail_screen.dart';
import 'create_card_set_screen.dart';
import 'settings_screen.dart';
import 'premium_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<CardSet> _cardSets = [];
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadCardSets();
  }

  void _loadCardSets() {
    setState(() {
      _cardSets = StorageService.getAllCardSets();
    });
  }

  List<CardSet> get _filteredCardSets {
    if (_searchQuery.isEmpty) return _cardSets;
    return _cardSets.where((set) {
      return set.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          (set.description?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    final user = StorageService.getCurrentUser();

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.menu),
            const SizedBox(width: 8),
            const Text('Q'),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                decoration: InputDecoration(
                  hintText: l10n.searchPlaceholder,
                  border: InputBorder.none,
                  hintStyle: TextStyle(color: theme.hintColor),
                ),
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                  });
                },
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _navigateToCreateSet(),
          ),
          if (!user!.hasActivePremium)
            TextButton(
              onPressed: () => _navigateToPremium(),
              style: TextButton.styleFrom(
                backgroundColor: Colors.yellow,
                foregroundColor: Colors.black,
              ),
              child: Text(l10n.tryFree),
            ),
          IconButton(
            icon: const Icon(Icons.account_circle),
            onPressed: () => _navigateToSettings(),
          ),
        ],
      ),
      drawer: _buildDrawer(context, l10n),
      body: RefreshIndicator(
        onRefresh: () async {
          _loadCardSets();
        },
        child: _filteredCardSets.isEmpty
            ? _buildEmptyState(context, l10n)
            : _buildCardSetsList(context, l10n),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _navigateToCreateSet(),
        icon: const Icon(Icons.add),
        label: Text(l10n.createNewSet),
      ),
    );
  }

  Widget _buildDrawer(BuildContext context, AppLocalizations l10n) {
    final theme = Theme.of(context);
    final user = StorageService.getCurrentUser();

    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: BoxDecoration(
              color: theme.colorScheme.primary,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: theme.colorScheme.secondary,
                  child: Text(
                    user?.username[0].toUpperCase() ?? 'U',
                    style: const TextStyle(fontSize: 24),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  user?.username ?? 'User',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (user?.hasActivePremium ?? false)
                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.yellow,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      l10n.premium,
                      style: const TextStyle(
                        color: Colors.black,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          ListTile(
            leading: const Icon(Icons.home),
            title: Text(l10n.home),
            selected: true,
            onTap: () => Navigator.pop(context),
          ),
          ListTile(
            leading: const Icon(Icons.folder),
            title: Text(l10n.yourLibrary),
            onTap: () => Navigator.pop(context),
          ),
          ListTile(
            leading: const Icon(Icons.notifications),
            title: Text(l10n.notifications),
            onTap: () => Navigator.pop(context),
          ),
          const Divider(),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              l10n.yourFolders,
              style: theme.textTheme.titleSmall,
            ),
          ),
          ListTile(
            leading: const Icon(Icons.folder_outlined),
            title: const Text('Engliosch'),
            onTap: () => Navigator.pop(context),
          ),
          ListTile(
            leading: const Icon(Icons.create_new_folder),
            title: Text(l10n.newFolder),
            onTap: () => Navigator.pop(context),
          ),
          const Divider(),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              l10n.startHere,
              style: theme.textTheme.titleSmall,
            ),
          ),
          ListTile(
            leading: const Icon(Icons.style),
            title: Text(l10n.flashcards),
            onTap: () => Navigator.pop(context),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.settings),
            title: Text(l10n.settings),
            onTap: () {
              Navigator.pop(context);
              _navigateToSettings();
            },
          ),
        ],
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
            l10n.noCardSets,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            l10n.createYourFirstSet,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }

  Widget _buildCardSetsList(BuildContext context, AppLocalizations l10n) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _filteredCardSets.length,
      itemBuilder: (context, index) {
        final cardSet = _filteredCardSets[index];
        final cardCount = StorageService.getFlashcardsBySet(cardSet.id).length;
        
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: const Icon(Icons.style, size: 32),
            title: Text(
              cardSet.title,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${l10n.cardSet} • $cardCount ${l10n.cards} • ${l10n.by} ${cardSet.userId}'),
                if (cardSet.description != null && cardSet.description!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      cardSet.description!,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
              ],
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (cardSet.isFavorite)
                  const Icon(Icons.bookmark, color: Colors.blue),
                IconButton(
                  icon: const Icon(Icons.more_vert),
                  onPressed: () => _showCardSetOptions(context, cardSet, l10n),
                ),
              ],
            ),
            onTap: () => _navigateToCardSetDetail(cardSet),
          ),
        );
      },
    );
  }

  void _showCardSetOptions(BuildContext context, CardSet cardSet, AppLocalizations l10n) {
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
                // TODO: Navigate to edit screen
              },
            ),
            ListTile(
              leading: const Icon(Icons.share),
              title: Text(l10n.share),
              onTap: () {
                Navigator.pop(context);
                _showShareDialog(context, cardSet, l10n);
              },
            ),
            ListTile(
              leading: const Icon(Icons.bookmark_border),
              title: Text(cardSet.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'),
              onTap: () {
                Navigator.pop(context);
                setState(() {
                  cardSet.isFavorite = !cardSet.isFavorite;
                  StorageService.updateCardSet(cardSet);
                  _loadCardSets();
                });
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete, color: Colors.red),
              title: Text(l10n.delete, style: const TextStyle(color: Colors.red)),
              onTap: () {
                Navigator.pop(context);
                _deleteCardSet(context, cardSet, l10n);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showShareDialog(BuildContext context, CardSet cardSet, AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.shareCode),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(cardSet.shareCode, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
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

  void _deleteCardSet(BuildContext context, CardSet cardSet, AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.delete),
        content: Text('Are you sure you want to delete "${cardSet.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(l10n.cancel),
          ),
          TextButton(
            onPressed: () {
              StorageService.deleteCardSet(cardSet.id);
              _loadCardSets();
              Navigator.pop(context);
            },
            child: Text(l10n.delete, style: const TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _navigateToCreateSet() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const CreateCardSetScreen()),
    );
    if (result == true) {
      _loadCardSets();
    }
  }

  void _navigateToCardSetDetail(CardSet cardSet) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CardSetDetailScreen(cardSet: cardSet),
      ),
    ).then((_) => _loadCardSets());
  }

  void _navigateToSettings() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const SettingsScreen()),
    );
  }

  void _navigateToPremium() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const PremiumScreen()),
    );
  }
}

