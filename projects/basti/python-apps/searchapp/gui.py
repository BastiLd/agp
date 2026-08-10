import os
import re
import sys
import logging
from datetime import datetime
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from queue import Queue
from PyQt5.QtCore import Qt, QSettings, QThread, pyqtSignal, QSize, QTimer
from PyQt5.QtGui import QIcon, QKeySequence, QStandardItemModel, QStandardItem
from PyQt5.QtWidgets import (
    QApplication,
    QMainWindow,
    QShortcut,
    QTabWidget,
    QWidget,
    QVBoxLayout,
    QHBoxLayout,
    QPushButton,
    QLabel,
    QLineEdit,
    QTableView,
    QComboBox,
    QTextEdit,
    QKeySequenceEdit,
    QStatusBar,
    QHeaderView,
    QProgressBar,
    QDateTimeEdit,
    QSpinBox,
    QMessageBox,
    QToolTip,
    QFileDialog,
    QToolBar,
    QMenuBar,
    QMenu,
    QStyle,
    QDialog,
)
from text_analyzer import TextAnalyzer
from settings_dialog import SettingsDialog

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

class FileSystemScanner(QThread):
    """Thread zum Scannen des Dateisystems im Hintergrund"""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.file_index = {}
        self.running = True
        
    def run(self):
        while self.running:
            try:
                self._scan_filesystem()
                # Warte 5 Minuten bis zum nächsten Scan
                for _ in range(300):  # 5 Minuten in 1-Sekunden-Schritten
                    if not self.running:
                        break
                    self.sleep(1)
            except Exception as e:
                print(f"Scan-Fehler: {e}")
                
    def _scan_filesystem(self):
        """Scannt das Dateisystem und baut den Index auf"""
        new_index = {}
        
        def scan_directory(path):
            try:
                with os.scandir(path) as entries:
                    for entry in entries:
                        if not self.running:
                            return
                        
                        try:
                            name = entry.name.lower()
                            if entry.is_file():
                                new_index[name] = new_index.get(name, [])
                                new_index[name].append((entry.path, entry))
                            elif entry.is_dir() and not name.startswith('.'):
                                new_index[name] = new_index.get(name, [])
                                new_index[name].append((entry.path, entry))
                                scan_directory(entry.path)
                        except (PermissionError, OSError):
                            continue
            except (PermissionError, OSError):
                return
                
        # Starte den Scan im Benutzerverzeichnis
        home = str(Path.home())
        scan_directory(home)
        
        # Aktualisiere den Index atomar
        self.file_index = new_index
        
    def stop(self):
        self.running = False
        
    def get_matches(self, search_term):
        """Sucht nach Dateien im Index"""
        search_term = search_term.lower()
        results = []
        
        # Direkter Zugriff auf den Index
        for name, entries in self.file_index.items():
            if search_term in name:
                for path, entry in entries:
                    try:
                        stats = entry.stat()
                        results.append((
                            entry.name,
                            path,
                            stats.st_size,
                            stats.st_mtime
                        ))
                    except (OSError, PermissionError):
                        continue
                        
        return results

class SearchWorker(QThread):
    """Worker-Thread für die Suche"""
    resultFound = pyqtSignal(tuple)
    searchFinished = pyqtSignal(int)

    def __init__(self, search_term, file_system_scanner):
        super().__init__()
        self.search_term = search_term
        self.file_system_scanner = file_system_scanner
        self.running = True
        
    def stop(self):
        self.running = False

    def run(self):
        if not self.running:
            return
            
        try:
            # Schnelle Suche im Index
            results = self.file_system_scanner.get_matches(self.search_term)
            
            found_count = 0
            for result in results:
                if not self.running:
                    break
                self.resultFound.emit(result)
                found_count += 1
                
            self.searchFinished.emit(found_count)
            
        except Exception as e:
            print(f"Suchfehler: {e}")
            self.searchFinished.emit(0)

class SearchApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.settings = QSettings("Everything", "SearchApp")
        self.setWindowTitle("All in Search")
        self.setGeometry(100, 100, 1200, 600)
        
        # Setze den Standardsuchpfad auf das Benutzerverzeichnis
        self.current_path = str(Path.home())
        
        # Initialisiere den Dateisystem-Scanner
        self.file_system_scanner = FileSystemScanner(self)
        self.file_system_scanner.start()
        
        self.search_worker = None
        self.search_delay_timer = QTimer()
        self.search_delay_timer.setSingleShot(True)
        self.search_delay_timer.timeout.connect(self._perform_search)
        
        self._create_menu_bar()
        self._create_toolbar()
        self._init_ui()
        self._load_settings()
        self._register_shortcut()
        
    def _create_menu_bar(self):
        menubar = self.menuBar()
        
        # Datei Menu
        file_menu = menubar.addMenu('Datei')
        new_window = file_menu.addAction('Neues Suchfenster')
        new_window.setShortcut('STRG+N')
        file_menu.addAction('Dateiliste öffnen...').setShortcut('STRG+O')
        file_menu.addAction('Dateiliste schließen')
        file_menu.addSeparator()
        file_menu.addAction('Schließen').setShortcut('STRG+W')
        file_menu.addSeparator()
        file_menu.addAction('Exportieren...').setShortcut('STRG+S')
        file_menu.addSeparator()
        file_menu.addAction('Beenden').setShortcut('STRG+Q')
        
        # Bearbeiten Menu
        edit_menu = menubar.addMenu('Bearbeiten')
        edit_menu.addAction('Ausschneiden').setShortcut('STRG+X')
        edit_menu.addAction('Kopieren').setShortcut('STRG+C')
        edit_menu.addAction('Einfügen').setShortcut('STRG+V')
        edit_menu.addSeparator()
        edit_menu.addAction('Kopieren nach...')
        edit_menu.addAction('Verschieben nach...')
        edit_menu.addSeparator()
        edit_menu.addAction('Alles auswählen').setShortcut('STRG+A')
        edit_menu.addAction('Auswahl umkehren')
        edit_menu.addSeparator()
        erweitert_menu = edit_menu.addMenu('Erweitert')
        erweitert_menu.addAction('Erweitertes Kopieren nach...')
        erweitert_menu.addAction('Erweitertes Verschieben nach...')
        
        # Ansicht Menu
        view_menu = menubar.addMenu('Ansicht')
        view_menu.addAction('Filter')
        view_menu.addAction('Vorschau').setShortcut('ALT+P')
        view_menu.addAction('Statusleiste').setCheckable(True)
        view_menu.addSeparator()
        
        # Symbol size submenu
        view_menu.addAction('Extra große Symbole').setShortcut('STRG+UMSCHALT+1')
        view_menu.addAction('Große Symbole').setShortcut('STRG+UMSCHALT+2')
        view_menu.addAction('Mittelgroße Symbole').setShortcut('STRG+UMSCHALT+3')
        view_menu.addAction('Details').setShortcut('STRG+UMSCHALT+6')
        
        # Window size submenu
        window_size = view_menu.addMenu('Fenstergröße')
        window_size.addAction('Klein').setShortcut('ALT+1')
        window_size.addAction('Mittel').setShortcut('ALT+2')
        window_size.addAction('Groß').setShortcut('ALT+3')
        window_size.addAction('Auto').setShortcut('ALT+4')
        
        # Text size submenu
        text_size = view_menu.addMenu('Textgröße')
        text_size.addAction('Vergrößern').setShortcut('STRG++')
        text_size.addAction('Verkleinern').setShortcut('STRG+-')
        text_size.addAction('Normal').setShortcut('STRG+0')
        
        # Sortieren nach submenu
        sort_menu = view_menu.addMenu('Sortieren nach')
        sort_menu.addAction('Name').setShortcut('STRG+1')
        sort_menu.addAction('Pfad').setShortcut('STRG+2')
        sort_menu.addAction('Größe').setShortcut('STRG+3')
        sort_menu.addAction('Erweiterung').setShortcut('STRG+4')
        sort_menu.addAction('Typ').setShortcut('STRG+5')
        sort_menu.addAction('Geändert am').setShortcut('STRG+6')
        sort_menu.addAction('Erstellt am').setShortcut('STRG+7')
        sort_menu.addAction('Letzter Zugriff am')
        sort_menu.addAction('Attribute').setShortcut('STRG+8')
        sort_menu.addAction('Kürzlich geändert').setShortcut('STRG+9')
        sort_menu.addSeparator()
        sort_menu.addAction('Anzahl der Ausführungen')
        sort_menu.addAction('Ausführungsdatum')
        sort_menu.addAction('Name der Dateiliste')
        sort_menu.addSeparator()
        sort_menu.addAction('Aufsteigend')
        sort_menu.addAction('Absteigend')

        # Wechseln zu submenu
        switch_menu = view_menu.addMenu('Wechseln zu')
        switch_menu.addAction('Neue Suche').setShortcut('ALT+POS1')
        
        view_menu.addAction('Aktualisieren').setShortcut('F5')
        
        # Im Vordergrund submenu
        foreground = view_menu.addMenu('Im Vordergrund')
        foreground.addAction('Niemals')
        foreground.addAction('Immer')
        foreground.addAction('Bei Suchvorgang')
        
        # Suchen Menu
        search_menu = menubar.addMenu('Suchen')
        search_menu.addAction('Groß- und Kleinschreibung beachten').setShortcut('STRG+I')
        search_menu.addAction('Ganzes Wort beachten').setShortcut('STRG+B')
        search_menu.addAction('Pfad beachten').setShortcut('STRG+U')
        search_menu.addAction('Diakritische Zeichen beachten').setShortcut('STRG+M')
        search_menu.addSeparator()
        search_menu.addAction('RegEx aktivieren').setShortcut('STRG+R')
        search_menu.addAction('Erweiterte Suche...')
        search_menu.addSeparator()
        search_menu.addAction('Filter hinzufügen...')
        search_menu.addAction('Filter verwalten...').setShortcut('STRG+UMSCHALT+F')
        search_menu.addSeparator()
        
        # File type filters
        search_menu.addAction('Alle Dateien')
        search_menu.addAction('Audio')
        search_menu.addAction('Archive')
        search_menu.addAction('Dokumente')
        search_menu.addAction('Ausführbare Dateien')
        search_menu.addAction('Ordner')
        search_menu.addAction('Bilder')
        search_menu.addAction('Videos')
        
        # Lesezeichen Menu
        bookmarks_menu = menubar.addMenu('Lesezeichen')
        bookmarks_menu.addAction('Lesezeichen hinzufügen...').setShortcut('STRG+D')
        bookmarks_menu.addAction('Lesezeichen verwalten...').setShortcut('STRG+UMSCHALT+B')
        
        # Extras Menu
        extras_menu = menubar.addMenu('Extras')
        extras_menu.addAction('Mit FTP-Server verbinden...')
        extras_menu.addAction('Vom ETP-Server trennen').setEnabled(False)
        extras_menu.addAction('Dateilisten-Editor...')
        extras_menu.addSeparator()
        settings_action = extras_menu.addAction('Einstellungen...')
        settings_action.setShortcut('STRG+P')
        settings_action.triggered.connect(self._show_settings_dialog)
        
        # Hilfe Menu
        help_menu = menubar.addMenu('Hilfe')
        help_menu.addAction('Online-Hilfe').setShortcut('F1')
        help_menu.addAction('Such-Syntax')
        help_menu.addAction('RegEx-Syntax')
        help_menu.addAction('Kommandozeilen-Optionen')
        help_menu.addSeparator()
        help_menu.addAction('Everything-Webseite öffnen')
        help_menu.addAction('Nach Programmaktualisierungen suchen...')
        help_menu.addAction('Spenden')
        help_menu.addSeparator()
        help_menu.addAction('Über Everything').setShortcut('STRG+F1')

    def _create_toolbar(self):
        # Erstelle die Toolbar
        self.toolbar = QToolBar()
        self.toolbar.setIconSize(QSize(16, 16))
        self.addToolBar(self.toolbar)

        # Lade Icons für verschiedene Dateitypen
        self.file_icons = {
            'folder': self.style().standardIcon(QStyle.SP_DirIcon),
            'file': self.style().standardIcon(QStyle.SP_FileIcon),
            'audio': self.style().standardIcon(QStyle.SP_MediaPlay),
            'image': self.style().standardIcon(QStyle.SP_DirIcon),
            'video': self.style().standardIcon(QStyle.SP_MediaPlay),
            'link': self.style().standardIcon(QStyle.SP_FileLinkIcon),
            'pdf': self.style().standardIcon(QStyle.SP_FileIcon),
            'doc': self.style().standardIcon(QStyle.SP_FileIcon),
            'exe': self.style().standardIcon(QStyle.SP_ComputerIcon),
            'shortcut': self.style().standardIcon(QStyle.SP_FileLinkIcon),
            'powerpoint': self.style().standardIcon(QStyle.SP_FileIcon),
            'excel': self.style().standardIcon(QStyle.SP_FileIcon),
            'archive': self.style().standardIcon(QStyle.SP_DriveFDIcon),
            'text': self.style().standardIcon(QStyle.SP_FileIcon),
            'code': self.style().standardIcon(QStyle.SP_FileIcon),
            'font': self.style().standardIcon(QStyle.SP_DriveFDIcon),
            'system': self.style().standardIcon(QStyle.SP_DriveHDIcon),
            'hidden': self.style().standardIcon(QStyle.SP_DirLinkIcon),
            'desktop': self.style().standardIcon(QStyle.SP_DesktopIcon),
            'network': self.style().standardIcon(QStyle.SP_DriveNetIcon),
            'home': self.style().standardIcon(QStyle.SP_DirHomeIcon),
            'up': self.style().standardIcon(QStyle.SP_ArrowUp),
            'down': self.style().standardIcon(QStyle.SP_ArrowDown),
            'refresh': self.style().standardIcon(QStyle.SP_BrowserReload),
            'search': self.style().standardIcon(QStyle.SP_FileDialogContentsView),
            'settings': self.style().standardIcon(QStyle.SP_FileDialogDetailedView),
            'help': self.style().standardIcon(QStyle.SP_MessageBoxQuestion),
            'info': self.style().standardIcon(QStyle.SP_MessageBoxInformation),
            'warning': self.style().standardIcon(QStyle.SP_MessageBoxWarning),
            'error': self.style().standardIcon(QStyle.SP_MessageBoxCritical),
        }
        
        # Toolbar Icons
        self.toolbar.setIconSize(QSize(16, 16))
        
        # Suchfeld mit Such-Icon
        search_action = self.toolbar.addAction(self.file_icons['search'], "")
        search_action.setEnabled(False)  # Nur als Icon-Anzeige
        
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Suchen")
        self.search_input.setMinimumWidth(200)
        self.search_input.textChanged.connect(self._on_search_text_changed)
        self.search_input.setStyleSheet("""
            QLineEdit {
                padding: 5px;
                border: 1px solid #ccc;
                border-radius: 2px;
                margin: 2px;
                background: white;
            }
        """)
        self.toolbar.addWidget(self.search_input)
        
        # Weitere Toolbar-Aktionen
        self.toolbar.addAction(self.file_icons['refresh'], "Aktualisieren")
        settings_action = self.toolbar.addAction(self.file_icons['settings'], "Einstellungen")
        settings_action.triggered.connect(self._show_settings_dialog)
        self.toolbar.addAction(self.file_icons['help'], "Hilfe")

    def _on_search_text_changed(self):
        """Wird aufgerufen, wenn sich der Suchtext ändert"""
        # Stoppe vorherige Suche
        if self.search_worker and self.search_worker.isRunning():
            self.search_worker.stop()
            
        # Starte Timer neu
        self.search_delay_timer.start(300)  # 300ms Verzögerung

    def _perform_search(self):
        """Startet die Suche mit dem Index"""
        search_term = self.search_input.text().strip()
        
        # Lösche vorherige Ergebnisse
        self.model.removeRows(0, self.model.rowCount())
        
        if not search_term:
            self.status_label.setText("0 Einträge")
            return
            
        # Erstelle und starte neuen Search Worker
        self.search_worker = SearchWorker(search_term, self.file_system_scanner)
        self.search_worker.resultFound.connect(self._handle_search_result)
        self.search_worker.searchFinished.connect(self._handle_search_finished)
        self.search_worker.start()

    def _handle_search_result(self, result):
        """Verarbeitet ein einzelnes Suchergebnis"""
        name, path, size, mtime = result
        
        # Erstelle Items für die Zeile
        name_item = QStandardItem(self._get_file_icon(path), name)
        path_item = QStandardItem(path)
        size_item = QStandardItem(self._format_size(size))
        date_item = QStandardItem(datetime.fromtimestamp(mtime).strftime("%d.%m.%Y %H:%M"))
        
        # Setze die Ausrichtung für die Größen- und Datumsspalte
        size_item.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
        date_item.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
        
        # Füge die Zeile hinzu
        self.model.appendRow([name_item, path_item, size_item, date_item])
        
        # Aktualisiere die Suchleiste und Statusleiste
        self.search_label.setText(self.search_input.text())
        self.status_label.setText(f"{self.model.rowCount()} Einträge")

    def _handle_search_finished(self, count):
        """Wird aufgerufen, wenn die Suche beendet ist"""
        if count == 0:
            self.status_label.setText("Keine Einträge gefunden")
        else:
            self.status_label.setText(f"{count} Einträge")
        # Sortiere die Ergebnisse nach Dateiname
        self.model.sort(0)

    def _init_ui(self):
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        layout = QVBoxLayout(central_widget)
        layout.setContentsMargins(2, 2, 2, 2)
        layout.setSpacing(0)

        # Suchfeld als Label über der Tabelle
        self.search_label = QLabel()
        self.search_label.setStyleSheet("""
            QLabel {
                padding: 5px;
                background-color: #f0f0f0;
                border-bottom: 1px solid #ddd;
            }
        """)
        layout.addWidget(self.search_label)

        # Filter ComboBox
        filter_layout = QHBoxLayout()
        filter_layout.setSpacing(5)
        self.filter_combo = QComboBox()
        self.filter_combo.addItems(['Alle Dateien', 'Audio', 'Archive', 'Dokumente', 
                                  'Ausführbare Dateien', 'Ordner', 'Bilder', 'Videos'])
        self.filter_combo.setStyleSheet("""
            QComboBox {
                padding: 2px;
                border: 1px solid #ccc;
                background: white;
            }
        """)
        filter_layout.addWidget(self.filter_combo)
        layout.addLayout(filter_layout)

        # Ergebnistabelle
        self.table = QTableView()
        self.model = QStandardItemModel(0, 4)
        self.model.setHorizontalHeaderLabels(['Name', 'Pfad', 'Größe', 'Geändert am'])
        self.table.setModel(self.model)
        
        # Kontextmenü für die Tabelle aktivieren
        self.table.setContextMenuPolicy(Qt.CustomContextMenu)
        self.table.customContextMenuRequested.connect(self._show_context_menu)

        # Tabellen-Styling
        self.table.setShowGrid(False)
        self.table.setAlternatingRowColors(True)
        self.table.verticalHeader().setVisible(True)  # Zeige Zeilennummern
        self.table.verticalHeader().setDefaultSectionSize(24)  # Zeilenhöhe
        self.table.setStyleSheet("""
            QTableView {
                border: none;
                selection-background-color: #3399ff;
                selection-color: white;
                alternate-background-color: #f7f7f7;
                gridline-color: transparent;
            }
            QTableView::item {
                padding: 2px;
                border: none;
            }
            QHeaderView::section {
                background-color: #f0f0f0;
                padding: 4px;
                border: none;
                border-right: 1px solid #ddd;
                border-bottom: 1px solid #ddd;
            }
            QHeaderView::section:horizontal {
                font-weight: bold;
            }
            QTableView::item:selected {
                background-color: #3399ff;
                color: white;
            }
        """)
        
        # Spaltenbreiten einstellen
        header = self.table.horizontalHeader()
        header.setSectionResizeMode(0, QHeaderView.Interactive)  # Name
        header.setSectionResizeMode(1, QHeaderView.Stretch)     # Pfad
        header.setSectionResizeMode(2, QHeaderView.Interactive) # Größe
        header.setSectionResizeMode(3, QHeaderView.Interactive) # Geändert am
        
        # Standardbreiten setzen
        self.table.setColumnWidth(0, 300)  # Name
        self.table.setColumnWidth(2, 100)  # Größe
        self.table.setColumnWidth(3, 150)  # Geändert am
        
        self.table.setSelectionBehavior(QTableView.SelectRows)
        self.table.setSelectionMode(QTableView.ExtendedSelection)
        self.table.setSortingEnabled(True)
        
        layout.addWidget(self.table)

        # Statusleiste
        self.status_bar = QStatusBar()
        self.status_bar.setStyleSheet("""
            QStatusBar {
                border-top: 1px solid #ddd;
                background: #f0f0f0;
            }
        """)
        self.setStatusBar(self.status_bar)
        self.status_label = QLabel("0 Einträge")
        self.status_bar.addWidget(self.status_label)

    def _load_settings(self):
        """Lade die gespeicherten Einstellungen"""
        # Fensterposition und -größe
        geometry = self.settings.value("geometry")
        if geometry:
            self.restoreGeometry(geometry)
        
        # Spaltenbreiten
        for i in range(4):
            width = self.settings.value(f"column_width_{i}")
            if width:
                self.table.setColumnWidth(i, int(width))
        
        # Letzter Suchpfad
        self.current_path = self.settings.value("last_path", str(Path.home()))

        # Filter
        default_filter = self.settings.value("default_filter", "Alle Dateien")
        idx = self.filter_combo.findText(default_filter)
        if idx >= 0:
            self.filter_combo.setCurrentIndex(idx)

    def _save_settings(self):
        """Speichere die aktuellen Einstellungen"""
        # Fensterposition und -größe
        self.settings.setValue("geometry", self.saveGeometry())
        
        # Spaltenbreiten
        for i in range(4):
            self.settings.setValue(f"column_width_{i}", self.table.columnWidth(i))
        
        # Aktueller Suchpfad
        self.settings.setValue("last_path", self.current_path)

    def closeEvent(self, event):
        """Wird beim Schließen des Fensters aufgerufen"""
        if self.search_worker and self.search_worker.isRunning():
            self.search_worker.stop()
            self.search_worker.wait()
            
        if self.file_system_scanner and self.file_system_scanner.isRunning():
            self.file_system_scanner.stop()
            self.file_system_scanner.wait()
            
        self._save_settings()
        super().closeEvent(event)

    def _format_size(self, size_in_bytes):
        """Formatiert die Dateigröße in lesbare Form"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_in_bytes < 1024:
                return f"{size_in_bytes:.0f} {unit}"
            size_in_bytes /= 1024
        return f"{size_in_bytes:.0f} TB"

    def keyPressEvent(self, event):
        # Strg+L oder Alt+D fokussiert das Suchfeld (wie in Everything)
        if (event.key() == Qt.Key_L and event.modifiers() & Qt.ControlModifier) or \
           (event.key() == Qt.Key_D and event.modifiers() & Qt.AltModifier):
            self.search_input.setFocus()
            self.search_input.selectAll()
        # Escape leert das Suchfeld
        elif event.key() == Qt.Key_Escape:
            self.search_input.clear()
        else:
            super().keyPressEvent(event)

    def _register_shortcut(self):
        seq = self.settings.value("shortcut", "Ctrl+Ä")
        shortcut = QShortcut(QKeySequence(seq), self)
        shortcut.activated.connect(self._toggle_visibility)

    def _toggle_visibility(self):
        if self.isVisible():
            self.hide()
        else:
            self.show()
            self.activateWindow()

    def _get_file_icon(self, file_path):
        """Ermittelt das passende Icon für einen Dateityp"""
        if os.path.isdir(file_path):
            if file_path.startswith('.'):
                return self.file_icons['hidden']
            if 'desktop' in file_path.lower():
                return self.file_icons['desktop']
            return self.file_icons['folder']
            
        name = file_path.lower()
        ext = os.path.splitext(name)[1].lower()
        
        # Audio-Dateien
        if ext in ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac']:
            return self.file_icons['audio']
            
        # Bild-Dateien
        elif ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp']:
            return self.file_icons['image']
            
        # Video-Dateien
        elif ext in ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm']:
            return self.file_icons['video']
            
        # Dokumente
        elif ext == '.pdf':
            return self.file_icons['pdf']
        elif ext in ['.doc', '.docx', '.rtf', '.odt']:
            return self.file_icons['doc']
        elif ext in ['.ppt', '.pptx', '.pps', '.ppsx']:
            return self.file_icons['powerpoint']
        elif ext in ['.xls', '.xlsx', '.csv']:
            return self.file_icons['excel']
            
        # Archiv-Dateien
        elif ext in ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2']:
            return self.file_icons['archive']
            
        # Text- und Code-Dateien
        elif ext in ['.txt', '.md', '.log']:
            return self.file_icons['text']
        elif ext in ['.py', '.java', '.cpp', '.h', '.js', '.html', '.css', '.php']:
            return self.file_icons['code']
            
        # System- und ausführbare Dateien
        elif ext in ['.exe', '.msi', '.bat', '.cmd']:
            return self.file_icons['exe']
        elif ext in ['.sys', '.dll', '.ini']:
            return self.file_icons['system']
            
        # Verknüpfungen
        elif ext in ['.lnk', '.url']:
            return self.file_icons['shortcut']
            
        # Font-Dateien
        elif ext in ['.ttf', '.otf', '.woff', '.woff2']:
            return self.file_icons['font']
            
        return self.file_icons['file']

    def _show_settings_dialog(self):
        """Öffnet den Einstellungsdialog"""
        dialog = SettingsDialog(self)
        if dialog.exec_() == QDialog.Accepted:
            dialog._apply_settings()
            # Aktualisiere die Anwendung nach Änderungen
            self._load_settings()

    def _show_context_menu(self, position):
        """Zeigt das Kontextmenü an der angegebenen Position"""
        menu = QMenu()
        
        # Datei Menü
        file_menu = menu.addMenu("Datei")
        file_menu.addAction("Öffnen")
        file_menu.addAction("Öffnen neu")
        file_menu.addAction("Pfad öffnen")
        file_menu.addAction("Öffnen mit")
        file_menu.addAction("Öffnen mit Standard-Programm")
        file_menu.addAction("Abspielen")
        file_menu.addAction("Vorschau")
        file_menu.addSeparator()
        file_menu.addAction("Löschen")
        file_menu.addAction("Löschen (Unwiderruflich)")
        file_menu.addAction("Bearbeiten")
        file_menu.addAction("Öffnen")
        file_menu.addAction("Auswahl öffnen und Everything beenden")
        file_menu.addAction("Explore Pfad")
        file_menu.addSeparator()
        file_menu.addAction("Schließen")
        file_menu.addAction("Exportieren...")
        file_menu.addAction("Pfad mit Namen kopieren")
        file_menu.addAction("Pfad kopieren")
        file_menu.addAction("Anzahl der Ausführungen setzen")
        file_menu.addAction("Verknüpfung erstellen")
        file_menu.addSeparator()
        file_menu.addAction("Drucken")
        file_menu.addAction("Drucken auf")
        file_menu.addAction("Eigenschaften")
        file_menu.addAction("Erweiterte Informationen einlesen...")
        file_menu.addAction("Umbenennen")
        file_menu.addAction("Ausführen als")
        file_menu.addSeparator()
        file_menu.addAction("Beenden")
        file_menu.addAction("Name kopieren")
        file_menu.addAction("Auswahl öffnen ohne Everything zu schließen")
        file_menu.addAction("Öffne meist ausgeführte Dateien")
        file_menu.addAction("Öffne zuletzt ausgeführt")
        file_menu.addAction("Benutzerdefiniert 1")
        
        # Bearbeiten Menü
        edit_menu = menu.addMenu("Bearbeiten")
        edit_menu.addAction("Ausschneiden")
        edit_menu.addAction("Kopieren")
        edit_menu.addAction("Einfügen")
        edit_menu.addAction("Alles auswählen")
        edit_menu.addAction("Auswahl umkehren")
        edit_menu.addSeparator()
        edit_menu.addAction("Kopieren nach...")
        edit_menu.addAction("Verschieben nach...")
        
        erweitert_menu = edit_menu.addMenu("Erweitert")
        erweitert_menu.addAction("Erweitertes Kopieren nach...")
        erweitert_menu.addAction("Erweitertes Verschieben nach...")
        
        # Ansicht Menü
        view_menu = menu.addMenu("Ansicht")
        view_menu.addAction("Statusleiste")
        view_menu.addAction("Details")
        view_menu.addAction("Mittelgroße Symbole")
        view_menu.addAction("Große Symbole")
        view_menu.addAction("Extra große Symbole")
        view_menu.addAction("Miniaturansicht vergrößern")
        view_menu.addAction("Miniaturansicht verkleinern")
        
        window_size = view_menu.addMenu("Fenstergröße")
        window_size.addAction("Klein")
        window_size.addAction("Mittel")
        window_size.addAction("Groß")
        window_size.addAction("Auto")
        window_size.addAction("Vergrößern")
        
        text_size = view_menu.addMenu("Textgröße")
        text_size.addAction("Verkleinern")
        text_size.addAction("Normal")
        
        sort_menu = view_menu.addMenu("Sortieren nach")
        sort_menu.addAction("Name")
        sort_menu.addAction("Pfad")
        sort_menu.addAction("Größe")
        sort_menu.addAction("Erweiterung")
        sort_menu.addAction("Typ")
        sort_menu.addAction("Geändert am")
        
        # Zeige das Menü an der Mausposition
        menu.exec_(self.table.viewport().mapToGlobal(position))