# Quizelt - Flashcard Learning App

A comprehensive Flutter application for creating and studying flashcards, inspired by Quizlet. This app supports offline learning, multiple study modes, premium features, and internationalization.

## Features

### Core Functionality
- **Card Set Management**: Create, edit, and organize flashcard sets
- **Flashcard Creation**: Add questions, answers, and hints to flashcards
- **Local Storage**: All data is stored locally using Hive (no internet required)
- **User Accounts**: Registration and login system with local authentication

### Study Modes
- **Flashcards**: Traditional flip-card study mode
- **Learn Mode**: Adaptive learning with progress tracking
- **Test Mode**: Quiz yourself and see your score
- **Match Mode**: Match questions with answers in a game format
- **Multiple Choice**: Answer questions with multiple choice options

### Additional Features
- **Dark Mode**: Full dark theme support with system preference detection
- **Internationalization**: English and German language support
- **Premium Model**: Lifetime (€14.99) or Yearly (€2.99) subscription options
- **Ad-Based Unlocks**: Watch ads to unlock premium features temporarily
- **Share & Export**: Share card sets via share codes or export as JSON
- **Progress Tracking**: Track your learning progress for each card
- **Favorites**: Mark card sets and flashcards as favorites

## Project Structure

```
lib/
├── main.dart                 # App entry point
├── models/                   # Data models
│   ├── flashcard.dart       # Flashcard model
│   ├── card_set.dart        # Card set model
│   ├── user.dart            # User model
│   └── progress.dart        # Progress tracking model
├── services/                 # Business logic
│   ├── storage_service.dart # Hive storage operations
│   └── theme_service.dart   # Theme management
├── screens/                  # UI screens
│   ├── home_screen.dart     # Main dashboard
│   ├── login_screen.dart    # Login page
│   ├── register_screen.dart # Registration page
│   ├── card_set_detail_screen.dart
│   ├── create_card_set_screen.dart
│   ├── flashcard_edit_screen.dart
│   ├── study_mode_screen.dart
│   ├── test_mode_screen.dart
│   ├── match_mode_screen.dart
│   ├── multiple_choice_screen.dart
│   ├── settings_screen.dart
│   └── premium_screen.dart
└── l10n/                     # Localization files
    ├── app_en.arb           # English translations
    └── app_de.arb           # German translations
```

## Setup Instructions

### Prerequisites
- Flutter SDK (3.0.0 or higher)
- Dart SDK (3.0.0 or higher)

### Installation

1. **Install dependencies:**
   ```bash
   flutter pub get
   ```

2. **Generate localization files:**
   ```bash
   flutter gen-l10n
   ```

3. **Generate Hive adapters (if needed):**
   ```bash
   flutter pub run build_runner build
   ```

4. **Run the app:**
   ```bash
   flutter run
   ```

## Usage

### Creating Your First Card Set

1. Register a new account or login
2. Click "Create New Set" on the home screen
3. Enter a title and optional description
4. Add flashcards with questions and answers
5. Start studying using any of the available modes

### Study Modes

- **Flashcards**: Tap the card to flip between question and answer
- **Learn**: Study cards with progress tracking
- **Test**: Answer cards and see your final score
- **Match**: Match questions with their answers
- **Multiple Choice**: Choose the correct answer from options

### Sharing Card Sets

1. Open a card set
2. Click the share icon
3. Copy the share code
4. Share the code with others
5. Others can import the set using the import feature

### Premium Features

- Purchase lifetime premium for €14.99
- Or subscribe yearly for €2.99
- Alternatively, watch ads to unlock features temporarily

## Technical Details

### Data Storage
- Uses Hive for local NoSQL database storage
- All data persists offline
- No server or internet connection required

### State Management
- Provider for theme management
- Direct state management in widgets

### Internationalization
- Uses Flutter's built-in i18n system
- Supports English (en) and German (de)
- Easy to add more languages

### Theme System
- Material Design 3
- Light and dark themes
- System preference detection
- Customizable color schemes

## Development Notes

- The app is designed to work completely offline
- User passwords are hashed using SHA-256 (for demo purposes)
- In production, implement proper password hashing (bcrypt, Argon2)
- Premium purchases are simulated (no real payment integration)
- Ad viewing is simulated (no real ad integration)

## Future Enhancements

- Cloud sync functionality
- Real payment integration
- Real ad integration (AdMob)
- Text-to-speech for flashcards
- Image support for flashcards
- Spaced repetition algorithm
- Statistics and analytics dashboard
- Social features (follow users, share publicly)

## License

This project is created for educational purposes.

