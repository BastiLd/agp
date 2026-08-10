import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';

class ThemeService extends ChangeNotifier {
  static const String _themeModeKey = 'themeMode';
  static const String _localeKey = 'locale';
  
  late Box<String> _settingsBox;

  ThemeMode _themeMode = ThemeMode.system;
  Locale _locale = const Locale('en');

  ThemeMode get themeMode => _themeMode;
  Locale get locale => _locale;

  ThemeService() {
    _init();
  }

  Future<void> _init() async {
    _settingsBox = Hive.box<String>('settings');
    
    // Load saved theme mode
    final savedThemeMode = _settingsBox.get(_themeModeKey);
    if (savedThemeMode != null) {
      _themeMode = ThemeMode.values.firstWhere(
        (mode) => mode.toString() == savedThemeMode,
        orElse: () => ThemeMode.system,
      );
    }
    
    // Load saved locale
    final savedLocale = _settingsBox.get(_localeKey);
    if (savedLocale != null) {
      final parts = savedLocale.split('_');
      _locale = Locale(parts[0], parts.length > 1 ? parts[1] : '');
    }
    
    notifyListeners();
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    _themeMode = mode;
    await _settingsBox.put(_themeModeKey, mode.toString());
    notifyListeners();
  }

  Future<void> setLocale(Locale locale) async {
    _locale = locale;
    await _settingsBox.put(_localeKey, '${locale.languageCode}_${locale.countryCode ?? ''}');
    notifyListeners();
  }

  ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: Colors.blue,
        brightness: Brightness.light,
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        elevation: 0,
      ),
      cardTheme: CardTheme(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }

  ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: Colors.blue,
        brightness: Brightness.dark,
      ),
      scaffoldBackgroundColor: const Color(0xFF1A1A2E),
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        elevation: 0,
        backgroundColor: Color(0xFF1A1A2E),
      ),
      cardTheme: CardTheme(
        elevation: 2,
        color: const Color(0xFF16213E),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      drawerTheme: const DrawerThemeData(
        backgroundColor: Color(0xFF16213E),
      ),
    );
  }
}

