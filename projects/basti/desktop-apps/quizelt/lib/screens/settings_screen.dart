import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import '../services/storage_service.dart';
import '../services/theme_service.dart';
import 'login_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    final themeService = Provider.of<ThemeService>(context);
    final user = StorageService.getCurrentUser();

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.settings),
      ),
      body: ListView(
        children: [
          // Profile Picture Section
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.profilePicture,
                  style: theme.textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                SizedBox(
                  height: 80,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: 15,
                    itemBuilder: (context, index) {
                      final isSelected = user?.profilePictureIndex == index;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: CircleAvatar(
                          radius: isSelected ? 35 : 30,
                          backgroundColor: isSelected
                              ? theme.colorScheme.primary
                              : theme.colorScheme.surfaceVariant,
                          child: Text(
                            String.fromCharCode(0x1F600 + index),
                            style: const TextStyle(fontSize: 30),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          const Divider(),
          // Personal Information
          _buildSection(
            context,
            l10n.personalInfo,
            [
              _buildInfoTile(
                context,
                l10n.username,
                user?.username ?? '',
                () {
                  // TODO: Edit username
                },
              ),
              _buildInfoTile(
                context,
                l10n.email,
                user?.email ?? '',
                () {
                  // TODO: Edit email
                },
              ),
              _buildDropdownTile(
                context,
                l10n.accountType,
                user?.accountType ?? l10n.student,
                [l10n.student, l10n.teacher],
                (value) {
                  if (user != null) {
                    user.accountType = value;
                    StorageService.updateUser(user);
                    setState(() {});
                  }
                },
              ),
              _buildInfoTile(
                context,
                l10n.schoolInfo,
                user?.schoolInfo ?? '',
                () {
                  // TODO: Edit school info
                },
              ),
            ],
          ),
          const Divider(),
          // Appearance
          _buildSection(
            context,
            'Appearance',
            [
              _buildDropdownTile(
                context,
                'Background',
                themeService.themeMode == ThemeMode.dark
                    ? 'Dark'
                    : themeService.themeMode == ThemeMode.light
                        ? 'Light'
                        : 'Auto',
                ['Auto', 'Light', 'Dark'],
                (value) {
                  ThemeMode mode;
                  switch (value) {
                    case 'Light':
                      mode = ThemeMode.light;
                      break;
                    case 'Dark':
                      mode = ThemeMode.dark;
                      break;
                    default:
                      mode = ThemeMode.system;
                  }
                  themeService.setThemeMode(mode);
                },
              ),
              _buildDropdownTile(
                context,
                l10n.language,
                themeService.locale.languageCode == 'de' ? l10n.german : l10n.english,
                [l10n.english, l10n.german],
                (value) {
                  final locale = value == l10n.german
                      ? const Locale('de')
                      : const Locale('en');
                  themeService.setLocale(locale);
                },
              ),
            ],
          ),
          const Divider(),
          // Account & Privacy
          _buildSection(
            context,
            l10n.accountPrivacy,
            [
              ListTile(
                leading: const Icon(Icons.lock),
                title: Text(l10n.changePassword),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  // TODO: Change password
                },
              ),
              ListTile(
                leading: const Icon(Icons.logout, color: Colors.red),
                title: Text(l10n.logout, style: const TextStyle(color: Colors.red)),
                onTap: () {
                  StorageService.logout();
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (context) => const LoginScreen()),
                    (route) => false,
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.delete_forever, color: Colors.red),
                title: Text(l10n.deleteAccount, style: const TextStyle(color: Colors.red)),
                onTap: () {
                  _showDeleteAccountDialog(context, l10n);
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSection(BuildContext context, String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        ...children,
      ],
    );
  }

  Widget _buildInfoTile(
    BuildContext context,
    String label,
    String value,
    VoidCallback onTap,
  ) {
    return ListTile(
      leading: const Icon(Icons.info_outline),
      title: Text(label),
      subtitle: value.isNotEmpty ? Text(value) : null,
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }

  Widget _buildDropdownTile(
    BuildContext context,
    String label,
    String currentValue,
    List<String> options,
    ValueChanged<String> onChanged,
  ) {
    return ListTile(
      leading: const Icon(Icons.settings),
      title: Text(label),
      subtitle: Text(currentValue),
      trailing: DropdownButton<String>(
        value: currentValue,
        items: options.map((option) {
          return DropdownMenuItem(
            value: option,
            child: Text(option),
          );
        }).toList(),
        onChanged: (value) {
          if (value != null) onChanged(value);
        },
      ),
    );
  }

  void _showDeleteAccountDialog(BuildContext context, AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.deleteAccount),
        content: Text(l10n.deleteAccountWarning),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(l10n.cancel),
          ),
          TextButton(
            onPressed: () {
              // TODO: Delete account
              Navigator.pop(context);
              StorageService.logout();
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (context) => const LoginScreen()),
                (route) => false,
              );
            },
            child: Text(
              l10n.deleteAccount,
              style: const TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }
}

