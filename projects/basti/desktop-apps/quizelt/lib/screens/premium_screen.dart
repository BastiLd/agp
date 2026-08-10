import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../services/storage_service.dart';

class PremiumScreen extends StatefulWidget {
  const PremiumScreen({super.key});

  @override
  State<PremiumScreen> createState() => _PremiumScreenState();
}

class _PremiumScreenState extends State<PremiumScreen> {
  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    final user = StorageService.getCurrentUser();

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.premium),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          if (user?.hasActivePremium ?? false)
            Card(
              color: Colors.green.withOpacity(0.2),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    const Icon(Icons.check_circle, color: Colors.green, size: 48),
                    const SizedBox(height: 8),
                    Text(
                      'You have Premium!',
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            Column(
              children: [
                Text(
                  'Learn more effectively with Q+',
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                // Lifetime option
                Card(
                  elevation: 4,
                  child: InkWell(
                    onTap: () => _purchasePremium(true),
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          Text(
                            '€14.99',
                            style: theme.textTheme.headlineMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            l10n.lifetime,
                            style: theme.textTheme.titleLarge,
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () => _purchasePremium(true),
                            child: Text('${l10n.upgrade} Now'),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                // Yearly option
                Card(
                  elevation: 4,
                  child: InkWell(
                    onTap: () => _purchasePremium(false),
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          Text(
                            '€2.99',
                            style: theme.textTheme.headlineMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            l10n.perYear,
                            style: theme.textTheme.titleLarge,
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () => _purchasePremium(false),
                            child: Text('${l10n.upgrade} Now'),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                const Divider(),
                const SizedBox(height: 16),
                Text(
                  'Or unlock features with ads',
                  style: theme.textTheme.titleMedium,
                ),
                const SizedBox(height: 16),
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.video_library),
                    title: const Text('Unlock Feature'),
                    subtitle: const Text('Watch an ad to unlock this feature once'),
                    trailing: ElevatedButton(
                      onPressed: () => _unlockWithAd('feature1'),
                      child: Text(l10n.watchAd),
                    ),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  void _purchasePremium(bool isLifetime) {
    final user = StorageService.getCurrentUser();
    if (user == null) return;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Purchase Premium'),
        content: Text(
          isLifetime
              ? 'Purchase lifetime premium for €14.99?'
              : 'Purchase yearly premium for €2.99?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              user.isPremium = true;
              if (isLifetime) {
                user.premiumExpiry = null; // Lifetime
              } else {
                user.premiumExpiry = DateTime.now().add(const Duration(days: 365));
              }
              StorageService.updateUser(user);
              Navigator.pop(context);
              setState(() {});
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Premium activated!')),
              );
            },
            child: const Text('Purchase'),
          ),
        ],
      ),
    );
  }

  void _unlockWithAd(String feature) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Watch Ad'),
        content: const Text('In a real app, this would show an ad video. For now, we\'ll unlock the feature.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              final user = StorageService.getCurrentUser();
              if (user != null) {
                user.unlockFeatureViaAd(feature);
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Feature unlocked!')),
                );
              }
            },
            child: const Text('Watch Ad'),
          ),
        ],
      ),
    );
  }
}

