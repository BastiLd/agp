import os
import sys
from PyQt5.QtWidgets import (
    QDialog, QTabWidget, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QLineEdit, QCheckBox, QSpinBox, QPushButton,
    QTreeWidget, QTreeWidgetItem, QGroupBox, QRadioButton,
    QListWidget, QComboBox, QFileDialog, QStackedWidget,
    QTableView, QHeaderView, QKeySequenceEdit, QGridLayout,
    QScrollArea, QListWidgetItem, QMessageBox
)
from PyQt5.QtCore import Qt, QSettings, QSize
from PyQt5.QtGui import QIcon, QStandardItemModel, QStandardItem

# Windows-specific imports with proper error handling
try:
    import win32api
    import win32file
    WINDOWS_SUPPORT = True
except ImportError:
    WINDOWS_SUPPORT = False
    # Dummy implementations for non-Windows systems
    class DummyWin32Api:
        @staticmethod
        def GetLogicalDriveStrings():
            return ""
        
        @staticmethod
        def GetVolumeInformation(drive):
            return ["", "", "", "", "DUMMY", "", "", ""]
    
    class DummyWin32File:
        DRIVE_FIXED = 3
        DRIVE_REMOVABLE = 2
        
        @staticmethod
        def GetDriveType(drive):
            return DummyWin32File.DRIVE_FIXED
    
    win32api = DummyWin32Api()
    win32file = DummyWin32File()
    print("Warning: Windows-specific features (drive detection) will be limited.")

class SettingsDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        
        # Basic window setup
        self.setWindowTitle("Einstellungen ändern")
        self.setMinimumWidth(800)
        self.setMinimumHeight(600)
        
        # Initialize settings
        self.settings = QSettings("Everything", "SearchApp")
        
        try:
            # Create main layout first
            self.main_layout = QVBoxLayout(self)
            
            # Create horizontal layout for tree and stack
            self.h_layout = QHBoxLayout()
            
            # Initialize models
            self.shortcuts_model = QStandardItemModel()
            self.shortcuts_model.setHorizontalHeaderLabels(["Aktion", "Tastenkombination"])
            
            # Create and set up the tree widget
            self.tree = QTreeWidget()
            self.tree.setHeaderHidden(True)
            self.tree.setFixedWidth(200)
            
            # Create the stack widget
            self.stack = QStackedWidget()
            
            # Create all pages
            self._create_pages()
            
            # Set up the tree items
            self._setup_tree()
            
            # Add widgets to layouts
            self.h_layout.addWidget(self.tree)
            self.h_layout.addWidget(self.stack)
            self.main_layout.addLayout(self.h_layout)
            
            # Add bottom buttons
            self._add_buttons()
            
            # Connect signals
            self.tree.itemClicked.connect(self._on_tree_item_clicked)
            
            # Initialize UI state
            self.tree.expandAll()
            self.tree.setCurrentItem(self.tree.topLevelItem(0))  # Select first item
            self.stack.setCurrentWidget(self.general_page)
            
            # Load settings
            self._load_settings()
            
        except Exception as e:
            print(f"Error initializing SettingsDialog: {e}")
            raise

    def _create_pages(self):
        """Create all settings pages"""
        try:
            self.general_page = self._create_general_page()
            self.interface_page = self._create_interface_page()
            self.search_page = self._create_search_page()
            self.search_functions_page = self._create_search_functions_page()
            self.search_results_page = self._create_search_results_page()
            self.view_page = self._create_view_page()
            self.context_menu_page = self._create_context_menu_page()
            self.font_color_page = self._create_font_color_page()
            self.shortcuts_page = self._create_shortcuts_page()
            self.history_page = self._create_history_page()
            self.database_page = self._create_database_page()
            self.ntfs_page = self._create_ntfs_page()
            self.refs_page = self._create_refs_page()
            self.folders_page = self._create_folders_page()
            self.filelists_page = self._create_filelists_page()
            self.exclude_page = self._create_exclude_page()
            self.server_page = self._create_server_page()
            self.etp_ftp_page = self._create_etp_ftp_page()
            self.http_page = self._create_http_page()
            
            # Add all pages to stack
            pages = [
                self.general_page, self.interface_page, self.search_page,
                self.search_functions_page, self.search_results_page,
                self.view_page, self.context_menu_page, self.font_color_page,
                self.shortcuts_page, self.history_page, self.database_page,
                self.ntfs_page, self.refs_page, self.folders_page,
                self.filelists_page, self.exclude_page, self.server_page,
                self.etp_ftp_page, self.http_page
            ]
            
            for page in pages:
                self.stack.addWidget(page)
                
        except Exception as e:
            print(f"Error creating pages: {e}")
            raise

    def _setup_tree(self):
        """Set up the tree widget with all items"""
        try:
            # Main categories
            self.general = QTreeWidgetItem(self.tree, ["Allgemein"])
            interface = QTreeWidgetItem(self.general, ["Bedienoberfläche"])
            search = QTreeWidgetItem(self.general, ["Suchstandards"])
            search_functions = QTreeWidgetItem(self.general, ["Suchfunktionen"])
            search_results = QTreeWidgetItem(self.general, ["Suchergebnisse"])
            view = QTreeWidgetItem(self.general, ["Ansicht"])
            context_menu = QTreeWidgetItem(self.general, ["Kontextmenü"])
            font_color = QTreeWidgetItem(self.general, ["Schrift und Farbe"])
            shortcuts = QTreeWidgetItem(self.general, ["Tastenbelegung"])
            
            history = QTreeWidgetItem(self.tree, ["Verlauf"])
            database = QTreeWidgetItem(self.tree, ["Datenbank"])
            ntfs = QTreeWidgetItem(database, ["NTFS-Laufwerke"])
            refs = QTreeWidgetItem(database, ["ReFS-Laufwerke"])
            folders = QTreeWidgetItem(database, ["Ordner"])
            filelists = QTreeWidgetItem(database, ["Dateilisten"])
            exclude = QTreeWidgetItem(database, ["Ein/Ausschluss"])
            
            servers = QTreeWidgetItem(self.tree, ["Server"])
            etp_ftp = QTreeWidgetItem(servers, ["ETP/FTP-Server"])
            http = QTreeWidgetItem(servers, ["HTTP-Server"])
            
        except Exception as e:
            print(f"Error setting up tree: {e}")
            raise

    def _add_buttons(self):
        """Add the bottom buttons to the dialog"""
        try:
            button_layout = QHBoxLayout()
            
            self.ok_button = QPushButton("OK")
            self.cancel_button = QPushButton("Abbrechen")
            self.apply_button = QPushButton("Übernehmen")
            
            self.ok_button.clicked.connect(self.accept)
            self.cancel_button.clicked.connect(self.reject)
            self.apply_button.clicked.connect(self._apply_settings)
            
            button_layout.addStretch()
            button_layout.addWidget(self.ok_button)
            button_layout.addWidget(self.cancel_button)
            button_layout.addWidget(self.apply_button)
            
            self.main_layout.addLayout(button_layout)
            
        except Exception as e:
            print(f"Error adding buttons: {e}")
            raise

    def _create_general_page(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(20, 10, 20, 10)
        
        # Überschrift
        layout.addWidget(QLabel("Allgemein"))
        
        # Sprache
        lang_layout = QHBoxLayout()
        lang_layout.addWidget(QLabel("Sprache:"))
        self.language_combo = QComboBox()
        self.language_combo.addItem("Deutsch (Systemstandard)")
        self.language_combo.setFixedWidth(300)
        lang_layout.addWidget(self.language_combo)
        download_btn = QPushButton("Download...")
        lang_layout.addWidget(download_btn)
        lang_layout.addStretch()
        layout.addLayout(lang_layout)
        
        # Checkboxen
        self.store_appdata = QCheckBox("Programmdaten in %APPDATA%\\Everything speichern")
        self.check_updates = QCheckBox("Beim Start nach Programmaktualisierungen suchen")
        self.start_with_windows = QCheckBox("\"Everything\" mit Windows starten")
        self.run_as_admin = QCheckBox("\"Everything\" als Administrator ausführen")
        self.use_service = QCheckBox("\"Everything\"-Systemdienst verwenden")
        self.show_folder_context = QCheckBox("Kontextmenü für Ordner anzeigen")
        self.create_startmenu = QCheckBox("Verknüpfung im Startmenü erstellen")
        self.create_desktop = QCheckBox("Verknüpfung auf dem Desktop erstellen")
        self.create_taskbar = QCheckBox("Verknüpfung im Infobereich der Taskleiste erstellen")
        self.create_es_urls = QCheckBox("Verknüpfung mit ES: URLs erstellen")
        self.create_efu = QCheckBox("Verknüpfung mit .EFU Dateien erstellen")
        
        # Standard-Werte setzen
        self.store_appdata.setChecked(True)
        self.start_with_windows.setChecked(True)
        self.use_service.setChecked(True)
        self.create_startmenu.setChecked(True)
        self.create_efu.setChecked(True)
        
        # Füge alle Checkboxen zum Layout hinzu
        for cb in [self.store_appdata, self.check_updates, self.start_with_windows,
                  self.run_as_admin, self.use_service, self.show_folder_context,
                  self.create_startmenu, self.create_desktop, self.create_taskbar,
                  self.create_es_urls, self.create_efu]:
            layout.addWidget(cb)
        
        layout.addStretch()
        
        # Standardeinstellungen Button
        defaults_layout = QHBoxLayout()
        defaults_layout.addStretch()
        defaults_btn = QPushButton("Standardeinstellungen")
        defaults_layout.addWidget(defaults_btn)
        layout.addLayout(defaults_layout)
        
        return page

    def _create_interface_page(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(20, 10, 20, 10)
        
        # Überschrift
        title = QLabel("Bedienoberfläche")
        title.setStyleSheet("font-weight: bold; font-size: 13px;")
        layout.addWidget(title)
        
        # Fensterverhalten
        window_group = QGroupBox("Fensterverhalten")
        window_layout = QVBoxLayout()
        
        self.minimize_to_tray = QCheckBox("Bei Minimieren in den Infobereich der Taskleiste")
        self.close_to_tray = QCheckBox("Bei Schließen in den Infobereich der Taskleiste")
        self.show_tray_icon = QCheckBox("Symbol im Infobereich der Taskleiste anzeigen")
        self.single_click_tray = QCheckBox("Einfachklick auf Symbol im Infobereich")
        self.hide_when_minimized = QCheckBox("Bei Minimieren ausblenden")
        self.save_window_position = QCheckBox("Fensterposition speichern")
        
        window_layout.addWidget(self.minimize_to_tray)
        window_layout.addWidget(self.close_to_tray)
        window_layout.addWidget(self.show_tray_icon)
        window_layout.addWidget(self.single_click_tray)
        window_layout.addWidget(self.hide_when_minimized)
        window_layout.addWidget(self.save_window_position)
        window_group.setLayout(window_layout)
        
        # Fensterposition
        position_group = QGroupBox("Fensterposition")
        position_layout = QVBoxLayout()
        
        self.center_on_screen = QRadioButton("Auf dem Bildschirm zentrieren")
        self.remember_position = QRadioButton("Letzte Position merken")
        self.custom_position = QRadioButton("Benutzerdefinierte Position")
        
        position_layout.addWidget(self.center_on_screen)
        position_layout.addWidget(self.remember_position)
        position_layout.addWidget(self.custom_position)
        
        # Benutzerdefinierte Position
        custom_pos_layout = QHBoxLayout()
        custom_pos_layout.addWidget(QLabel("X:"))
        self.pos_x = QSpinBox()
        self.pos_x.setRange(-10000, 10000)
        custom_pos_layout.addWidget(self.pos_x)
        custom_pos_layout.addWidget(QLabel("Y:"))
        self.pos_y = QSpinBox()
        self.pos_y.setRange(-10000, 10000)
        custom_pos_layout.addWidget(self.pos_y)
        custom_pos_layout.addStretch()
        position_layout.addLayout(custom_pos_layout)
        
        position_group.setLayout(position_layout)
        
        # Fenstergröße
        size_group = QGroupBox("Fenstergröße")
        size_layout = QVBoxLayout()
        
        self.remember_size = QRadioButton("Letzte Größe merken")
        self.custom_size = QRadioButton("Benutzerdefinierte Größe")
        
        size_layout.addWidget(self.remember_size)
        size_layout.addWidget(self.custom_size)
        
        # Benutzerdefinierte Größe
        custom_size_layout = QHBoxLayout()
        custom_size_layout.addWidget(QLabel("Breite:"))
        self.width_spin = QSpinBox()
        self.width_spin.setRange(100, 10000)
        custom_size_layout.addWidget(self.width_spin)
        custom_size_layout.addWidget(QLabel("Höhe:"))
        self.height_spin = QSpinBox()
        self.height_spin.setRange(100, 10000)
        custom_size_layout.addWidget(self.height_spin)
        custom_size_layout.addStretch()
        size_layout.addLayout(custom_size_layout)
        
        size_group.setLayout(size_layout)
        
        # Füge alle Gruppen zum Layout hinzu
        layout.addWidget(window_group)
        layout.addWidget(position_group)
        layout.addWidget(size_group)
        layout.addStretch()
        
        return page

    def _create_search_page(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(20, 10, 20, 10)
        
        # Überschrift
        title = QLabel("Suchstandards")
        title.setStyleSheet("font-weight: bold; font-size: 13px;")
        layout.addWidget(title)
        
        # Suchoptionen
        options_group = QGroupBox("Suchoptionen")
        options_layout = QVBoxLayout()
        
        self.match_case = QCheckBox("Groß-/Kleinschreibung beachten")
        self.match_whole_word = QCheckBox("Ganzes Wort beachten")
        self.match_path = QCheckBox("Pfad beachten")
        self.match_diacritics = QCheckBox("Diakritische Zeichen beachten")
        self.enable_regex = QCheckBox("Reguläre Ausdrücke aktivieren")
        
        options_layout.addWidget(self.match_case)
        options_layout.addWidget(self.match_whole_word)
        options_layout.addWidget(self.match_path)
        options_layout.addWidget(self.match_diacritics)
        options_layout.addWidget(self.enable_regex)
        options_group.setLayout(options_layout)
        
        # Dateityp-Filter
        filter_group = QGroupBox("Dateityp-Filter")
        filter_layout = QVBoxLayout()
        
        self.default_filter = QComboBox()
        self.default_filter.addItems([
            "Alle Dateien",
            "Audio",
            "Archive",
            "Dokumente",
            "Ausführbare Dateien",
            "Ordner",
            "Bilder",
            "Videos"
        ])
        
        filter_layout.addWidget(QLabel("Standard-Filter:"))
        filter_layout.addWidget(self.default_filter)
        filter_group.setLayout(filter_layout)
        
        # Füge Gruppen zum Layout hinzu
        layout.addWidget(options_group)
        layout.addWidget(filter_group)
        layout.addStretch()
        
        return page

    def _create_search_functions_page(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(20, 10, 20, 10)
        
        # Überschrift
        title = QLabel("Suchfunktionen")
        title.setStyleSheet("font-weight: bold; font-size: 13px;")
        layout.addWidget(title)
        
        # Suchverhalten
        behavior_group = QGroupBox("Suchverhalten")
        behavior_layout = QVBoxLayout()
        
        self.search_as_you_type = QCheckBox("Während der Eingabe suchen")
        self.instant_search = QCheckBox("Sofortsuche")
        self.clear_search_on_open = QCheckBox("Suchfeld beim Öffnen leeren")
        self.focus_search_on_open = QCheckBox("Suchfeld beim Öffnen fokussieren")
        
        behavior_layout.addWidget(self.search_as_you_type)
        behavior_layout.addWidget(self.instant_search)
        behavior_layout.addWidget(self.clear_search_on_open)
        behavior_layout.addWidget(self.focus_search_on_open)
        behavior_group.setLayout(behavior_layout)
        
        # Suchverzögerung
        delay_group = QGroupBox("Suchverzögerung")
        delay_layout = QVBoxLayout()
        
        delay_input = QHBoxLayout()
        self.search_delay = QSpinBox()
        self.search_delay.setRange(0, 10000)
        self.search_delay.setSuffix(" ms")
        delay_input.addWidget(QLabel("Verzögerung:"))
        delay_input.addWidget(self.search_delay)
        delay_input.addStretch()
        
        delay_layout.addLayout(delay_input)
        delay_group.setLayout(delay_layout)
        
        # Füge Gruppen zum Layout hinzu
        layout.addWidget(behavior_group)
        layout.addWidget(delay_group)
        layout.addStretch()
        
        return page

    def _create_search_results_page(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(20, 10, 20, 10)
        
        # Überschrift
        title = QLabel("Suchergebnisse")
        title.setStyleSheet("font-weight: bold; font-size: 13px;")
        layout.addWidget(title)
        
        # Anzeigeoptionen
        display_group = QGroupBox("Anzeigeoptionen")
        display_layout = QVBoxLayout()
        
        self.show_file_icons = QCheckBox("Dateisymbole anzeigen")
        self.show_grid_lines = QCheckBox("Gitternetzlinien anzeigen")
        self.alternate_row_colors = QCheckBox("Alternierende Zeilenfarben")
        self.show_tooltips = QCheckBox("Tooltips anzeigen")
        self.full_row_select = QCheckBox("Ganze Zeile auswählen")
        
        display_layout.addWidget(self.show_file_icons)
        display_layout.addWidget(self.show_grid_lines)
        display_layout.addWidget(self.alternate_row_colors)
        display_layout.addWidget(self.show_tooltips)
        display_layout.addWidget(self.full_row_select)
        display_group.setLayout(display_layout)
        
        # Sortierung
        sort_group = QGroupBox("Sortierung")
        sort_layout = QVBoxLayout()
        
        self.default_sort = QComboBox()
        self.default_sort.addItems([
            "Name",
            "Pfad",
            "Größe",
            "Erweiterung",
            "Typ",
            "Geändert am",
            "Erstellt am",
            "Letzter Zugriff"
        ])
        
        sort_layout.addWidget(QLabel("Standardsortierung:"))
        sort_layout.addWidget(self.default_sort)
        
        self.sort_ascending = QRadioButton("Aufsteigend")
        self.sort_descending = QRadioButton("Absteigend")
        
        sort_layout.addWidget(self.sort_ascending)
        sort_layout.addWidget(self.sort_descending)
        sort_group.setLayout(sort_layout)
        
        # Füge Gruppen zum Layout hinzu
        layout.addWidget(display_group)
        layout.addWidget(sort_group)
        layout.addStretch()
        
        return page

    def _create_view_page(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(20, 10, 20, 10)
        
        # Überschrift
        title = QLabel("Ansicht")
        title.setStyleSheet("font-weight: bold; font-size: 13px;")
        layout.addWidget(title)
        
        # Symbolansicht
        icon_group = QGroupBox("Symbolansicht")
        icon_layout = QVBoxLayout()
        
        self.show_file_icons = QCheckBox("Dateisymbole anzeigen")
        self.show_overlay_icons = QCheckBox("Overlay-Symbole anzeigen")
        self.show_grid = QCheckBox("Gitternetzlinien anzeigen")
        self.full_row_select = QCheckBox("Ganze Zeile auswählen")
        
        icon_layout.addWidget(self.show_file_icons)
        icon_layout.addWidget(self.show_overlay_icons)
        icon_layout.addWidget(self.show_grid)
        icon_layout.addWidget(self.full_row_select)
        icon_group.setLayout(icon_layout)
        
        # Symbolgrößen
        size_group = QGroupBox("Symbolgrößen")
        size_layout = QVBoxLayout()
        
        self.size_extra_large = QRadioButton("Extra große Symbole")
        self.size_large = QRadioButton("Große Symbole")
        self.size_medium = QRadioButton("Mittelgroße Symbole")
        self.size_small = QRadioButton("Kleine Symbole")
        self.size_list = QRadioButton("Liste")
        self.size_details = QRadioButton("Details")
        
        size_layout.addWidget(self.size_extra_large)
        size_layout.addWidget(self.size_large)
        size_layout.addWidget(self.size_medium)
        size_layout.addWidget(self.size_small)
        size_layout.addWidget(self.size_list)
        size_layout.addWidget(self.size_details)
        size_group.setLayout(size_layout)
        
        # Spalten
        columns_group = QGroupBox("Spalten")
        columns_layout = QVBoxLayout()
        
        self.columns = QListWidget()
        self.columns.addItems([
            "Name",
            "Pfad",
            "Größe",
            "Erweiterung",
            "Datum geändert",
            "Datum erstellt",
            "Letzter Zugriff",
            "Attribute",
            "Dateityp"
        ])
        self.columns.setSelectionMode(QListWidget.MultiSelection)
        
        columns_layout.addWidget(self.columns)
        columns_group.setLayout(columns_layout)
        
        # Füge alle Gruppen zum Layout hinzu
        layout.addWidget(icon_group)
        layout.addWidget(size_group)
        layout.addWidget(columns_group)
        
        return page

    def _create_context_menu_page(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(20, 10, 20, 10)
        
        # Überschrift
        title = QLabel("Kontextmenü")
        title.setStyleSheet("font-weight: bold; font-size: 13px;")
        layout.addWidget(title)
        
        # Menüeinträge
        entries_group = QGroupBox("Menüeinträge")
        entries_layout = QVBoxLayout()
        
        self.menu_entries = QListWidget()
        entries = [
            "Öffnen",
            "Öffnen mit",
            "Bearbeiten",
            "Kopieren",
            "Ausschneiden",
            "Einfügen",
            "Löschen",
            "Umbenennen",
            "Eigenschaften",
            "Als Administrator ausführen",
            "In Zwischenablage kopieren",
            "Pfad kopieren",
            "Dateiliste exportieren",
            "Erweiterte Funktionen"
        ]
        self.menu_entries.addItems(entries)
        self.menu_entries.setSelectionMode(QListWidget.MultiSelection)
        
        entries_layout.addWidget(self.menu_entries)
        entries_group.setLayout(entries_layout)
        
        # Erweiterte Optionen
        advanced_group = QGroupBox("Erweiterte Optionen")
        advanced_layout = QVBoxLayout()
        
        self.show_icons = QCheckBox("Symbole im Kontextmenü anzeigen")
        self.show_shortcuts = QCheckBox("Tastenkombinationen anzeigen")
        self.show_extended = QCheckBox("Erweitertes Kontextmenü anzeigen")
        
        advanced_layout.addWidget(self.show_icons)
        advanced_layout.addWidget(self.show_shortcuts)
        advanced_layout.addWidget(self.show_extended)
        advanced_group.setLayout(advanced_layout)
        
        # Füge Gruppen zum Layout hinzu
        layout.addWidget(entries_group)
        layout.addWidget(advanced_group)
        layout.addStretch()
        
        return page

    def _create_font_color_page(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(20, 10, 20, 10)
        
        # Überschrift
        title = QLabel("Schrift und Farbe")
        title.setStyleSheet("font-weight: bold; font-size: 13px;")
        layout.addWidget(title)
        
        # Schriftart
        font_group = QGroupBox("Schriftart")
        font_layout = QVBoxLayout()
        
        font_select = QHBoxLayout()
        self.font_combo = QComboBox()
        self.font_combo.addItems([
            "Segoe UI",
            "Arial",
            "Tahoma",
            "Verdana",
            "System"
        ])
        font_select.addWidget(QLabel("Schriftart:"))
        font_select.addWidget(self.font_combo)
        
        size_select = QHBoxLayout()
        self.font_size = QSpinBox()
        self.font_size.setRange(6, 72)
        self.font_size.setValue(9)
        size_select.addWidget(QLabel("Größe:"))
        size_select.addWidget(self.font_size)
        
        font_layout.addLayout(font_select)
        font_layout.addLayout(size_select)
        font_group.setLayout(font_layout)
        
        # Farben
        colors_group = QGroupBox("Farben")
        colors_layout = QVBoxLayout()
        
        self.use_system_colors = QCheckBox("Systemfarben verwenden")
        colors_layout.addWidget(self.use_system_colors)
        
        # Farbauswahl für verschiedene Elemente
        color_elements = [
            "Hintergrund",
            "Text",
            "Ausgewählter Hintergrund",
            "Ausgewählter Text",
            "Gitternetzlinien",
            "Alternierender Hintergrund"
        ]
        
        self.color_buttons = {}
        for element in color_elements:
            btn_layout = QHBoxLayout()
            btn_layout.addWidget(QLabel(element + ":"))
            color_btn = QPushButton()
            color_btn.setFixedSize(24, 24)
            self.color_buttons[element] = color_btn
            btn_layout.addWidget(color_btn)
            btn_layout.addStretch()
            colors_layout.addLayout(btn_layout)
        
        colors_group.setLayout(colors_layout)
        
        # Füge Gruppen zum Layout hinzu
        layout.addWidget(font_group)
        layout.addWidget(colors_group)
        layout.addStretch()
        
        return page

    def _create_shortcuts_page(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(20, 10, 20, 10)
        
        # Überschrift
        title = QLabel("Tastenbelegung")
        title.setStyleSheet("font-weight: bold; font-size: 13px;")
        layout.addWidget(title)
        
        # Tastenkombinationen
        shortcuts_group = QGroupBox("Tastenkombinationen")
        shortcuts_layout = QVBoxLayout()
        
        # Liste der Tastenkombinationen
        self.shortcuts_list = QTableView()
        self.shortcuts_model.setHorizontalHeaderLabels(["Aktion", "Tastenkombination"])
        
        shortcuts = {
            "Neue Suche": "Alt+Home",
            "Alles auswählen": "Strg+A",
            "Kopieren": "Strg+C",
            "Einfügen": "Strg+V",
            "Ausschneiden": "Strg+X",
            "Löschen": "Entf",
            "Eigenschaften": "Alt+Enter",
            "Aktualisieren": "F5",
            "Einstellungen": "Strg+P",
            "Beenden": "Alt+F4"
        }
        
        for action, shortcut in shortcuts.items():
            action_item = QStandardItem(action)
            shortcut_item = QStandardItem(shortcut)
            self.shortcuts_model.appendRow([action_item, shortcut_item])
        
        self.shortcuts_list.setModel(self.shortcuts_model)
        self.shortcuts_list.horizontalHeader().setSectionResizeMode(0, QHeaderView.Stretch)
        self.shortcuts_list.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeToContents)
        
        shortcuts_layout.addWidget(self.shortcuts_list)
        
        # Bearbeiten-Bereich
        edit_layout = QHBoxLayout()
        edit_layout.addWidget(QLabel("Neue Tastenkombination:"))
        self.shortcut_edit = QKeySequenceEdit()
        edit_layout.addWidget(self.shortcut_edit)
        self.assign_button = QPushButton("Zuweisen")
        edit_layout.addWidget(self.assign_button)
        shortcuts_layout.addLayout(edit_layout)
        
        shortcuts_group.setLayout(shortcuts_layout)
        
        # Optionen
        options_group = QGroupBox("Optionen")
        options_layout = QVBoxLayout()
        
        self.enable_all_shortcuts = QCheckBox("Alle Tastenkombinationen aktivieren")
        self.show_shortcuts_in_menu = QCheckBox("Tastenkombinationen in Menüs anzeigen")
        
        options_layout.addWidget(self.enable_all_shortcuts)
        options_layout.addWidget(self.show_shortcuts_in_menu)
        options_group.setLayout(options_layout)
        
        # Füge Gruppen zum Layout hinzu
        layout.addWidget(shortcuts_group)
        layout.addWidget(options_group)
        
        return page

    def _create_history_page(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(20, 10, 20, 10)
        
        # Überschrift
        title = QLabel("Verlauf")
        title.setStyleSheet("font-weight: bold; font-size: 13px;")
        layout.addWidget(title)
        
        # Suchverlauf
        search_group = QGroupBox("Suchverlauf")
        search_layout = QVBoxLayout()
        
        self.enable_search_history = QCheckBox("Suchverlauf aktivieren")
        
        keep_search_layout = QHBoxLayout()
        keep_search_layout.addWidget(QLabel("Behalten für:"))
        self.keep_search_days = QSpinBox()
        self.keep_search_days.setRange(1, 365)
        self.keep_search_days.setValue(90)
        self.keep_search_days.setSuffix(" Tage")
        keep_search_layout.addWidget(self.keep_search_days)
        keep_search_layout.addStretch()
        
        self.always_show_suggestions = QCheckBox("Suchvorschläge immer anzeigen")
        self.save_empty_searches = QCheckBox("Leere Suchen speichern")
        
        search_layout.addWidget(self.enable_search_history)
        search_layout.addLayout(keep_search_layout)
        search_layout.addWidget(self.always_show_suggestions)
        search_layout.addWidget(self.save_empty_searches)
        search_group.setLayout(search_layout)
        
        # Ausführungsverlauf
        exec_group = QGroupBox("Ausführungsverlauf")
        exec_layout = QVBoxLayout()
        
        self.enable_exec_history = QCheckBox("Ausführungsverlauf aktivieren")
        
        keep_exec_layout = QHBoxLayout()
        keep_exec_layout.addWidget(QLabel("Behalten für:"))
        self.keep_exec_days = QSpinBox()
        self.keep_exec_days.setRange(1, 365)
        self.keep_exec_days.setValue(90)
        self.keep_exec_days.setSuffix(" Tage")
        keep_exec_layout.addWidget(self.keep_exec_days)
        keep_exec_layout.addStretch()
        
        exec_layout.addWidget(self.enable_exec_history)
        exec_layout.addLayout(keep_exec_layout)
        exec_group.setLayout(exec_layout)
        
        # Verlauf löschen
        clear_group = QGroupBox("Verlauf löschen")
        clear_layout = QVBoxLayout()
        
        clear_search_btn = QPushButton("Suchverlauf löschen")
        clear_exec_btn = QPushButton("Ausführungsverlauf löschen")
        clear_all_btn = QPushButton("Gesamten Verlauf löschen")
        
        clear_layout.addWidget(clear_search_btn)
        clear_layout.addWidget(clear_exec_btn)
        clear_layout.addWidget(clear_all_btn)
        clear_group.setLayout(clear_layout)
        
        # Füge Gruppen zum Layout hinzu
        layout.addWidget(search_group)
        layout.addWidget(exec_group)
        layout.addWidget(clear_group)
        layout.addStretch()
        
        return page

    def _create_database_page(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(20, 10, 20, 10)
        
        # Überschrift
        title = QLabel("Datenbank")
        title.setStyleSheet("font-weight: bold; font-size: 13px;")
        layout.addWidget(title)
        
        # NTFS-Laufwerke
        ntfs_group = QGroupBox("NTFS-Laufwerke")
        ntfs_layout = QVBoxLayout()
        
        # Auto-include options
        self.auto_include_fixed = QCheckBox("Neue Festplatten automatisch einbinden")
        self.auto_include_removable = QCheckBox("Neue Wechseldatenträger automatisch einbinden")
        self.auto_remove_offline = QCheckBox("Offline-Laufwerke automatisch entfernen")
        
        ntfs_layout.addWidget(self.auto_include_fixed)
        ntfs_layout.addWidget(self.auto_include_removable)
        ntfs_layout.addWidget(self.auto_remove_offline)
        
        # NTFS drives list
        ntfs_layout.addWidget(QLabel("Lokale NTFS-Laufwerke:"))
        self.ntfs_drives_list = QListWidget()
        ntfs_layout.addWidget(self.ntfs_drives_list)
        ntfs_group.setLayout(ntfs_layout)
        
        # ReFS-Laufwerke
        refs_group = QGroupBox("ReFS-Laufwerke")
        refs_layout = QVBoxLayout()
        
        self.refs_drives_list = QListWidget()
        refs_layout.addWidget(QLabel("Lokale ReFS-Laufwerke:"))
        refs_layout.addWidget(self.refs_drives_list)
        refs_group.setLayout(refs_layout)
        
        # Ordner
        folder_group = QGroupBox("Ordner")
        folder_layout = QVBoxLayout()
        
        self.folder_list = QListWidget()
        folder_buttons = QHBoxLayout()
        add_folder_btn = QPushButton("Hinzufügen...")
        remove_folder_btn = QPushButton("Entfernen")
        folder_buttons.addWidget(add_folder_btn)
        folder_buttons.addWidget(remove_folder_btn)
        folder_buttons.addStretch()
        
        self.watch_folder_changes = QCheckBox("Überwache Änderungen")
        self.folder_cache_size = QSpinBox()
        self.folder_cache_size.setRange(0, 1000000)
        self.folder_cache_size.setSuffix(" MB")
        
        folder_layout.addWidget(self.folder_list)
        folder_layout.addLayout(folder_buttons)
        folder_layout.addWidget(self.watch_folder_changes)
        folder_layout.addWidget(QLabel("Größe des Zwischenspeichers:"))
        folder_layout.addWidget(self.folder_cache_size)
        folder_group.setLayout(folder_layout)
        
        # Füge Gruppen zum Layout hinzu
        layout.addWidget(ntfs_group)
        layout.addWidget(refs_group)
        layout.addWidget(folder_group)
        
        # Connect signals
        add_folder_btn.clicked.connect(self._add_folder)
        remove_folder_btn.clicked.connect(self._remove_folder)
        
        # Populate drive lists
        self._populate_drive_lists()
        
        return page

    def _create_server_page(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(20, 10, 20, 10)
        
        # Überschrift
        title = QLabel("Server")
        title.setStyleSheet("font-weight: bold; font-size: 13px;")
        layout.addWidget(title)
        
        # HTTP-Server
        http_group = QGroupBox("HTTP-Server")
        http_layout = QVBoxLayout()
        
        self.enable_http = QCheckBox("HTTP-Server aktivieren")
        
        port_layout = QHBoxLayout()
        port_layout.addWidget(QLabel("HTTP-Server Port:"))
        self.http_port = QSpinBox()
        self.http_port.setRange(1, 65535)
        self.http_port.setValue(80)
        port_layout.addWidget(self.http_port)
        port_layout.addStretch()
        
        auth_layout = QVBoxLayout()
        auth_layout.addWidget(QLabel("HTTP-Server Authentifizierung:"))
        self.http_auth = QCheckBox("Authentifizierung aktivieren")
        auth_layout.addWidget(self.http_auth)
        
        cred_layout = QGridLayout()
        cred_layout.addWidget(QLabel("Benutzername:"), 0, 0)
        self.http_username = QLineEdit()
        cred_layout.addWidget(self.http_username, 0, 1)
        cred_layout.addWidget(QLabel("Passwort:"), 1, 0)
        self.http_password = QLineEdit()
        self.http_password.setEchoMode(QLineEdit.Password)
        cred_layout.addWidget(self.http_password, 1, 1)
        
        http_layout.addWidget(self.enable_http)
        http_layout.addLayout(port_layout)
        http_layout.addLayout(auth_layout)
        http_layout.addLayout(cred_layout)
        http_group.setLayout(http_layout)
        
        # FTP-Server
        ftp_group = QGroupBox("FTP-Server")
        ftp_layout = QVBoxLayout()
        
        self.enable_ftp = QCheckBox("FTP-Server aktivieren")
        
        ftp_port_layout = QHBoxLayout()
        ftp_port_layout.addWidget(QLabel("FTP-Server Port:"))
        self.ftp_port = QSpinBox()
        self.ftp_port.setRange(1, 65535)
        self.ftp_port.setValue(21)
        ftp_port_layout.addWidget(self.ftp_port)
        ftp_port_layout.addStretch()
        
        ftp_auth_layout = QVBoxLayout()
        ftp_auth_layout.addWidget(QLabel("FTP-Server Authentifizierung:"))
        self.ftp_auth = QCheckBox("Authentifizierung aktivieren")
        ftp_auth_layout.addWidget(self.ftp_auth)
        
        ftp_cred_layout = QGridLayout()
        ftp_cred_layout.addWidget(QLabel("Benutzername:"), 0, 0)
        self.ftp_username = QLineEdit()
        ftp_cred_layout.addWidget(self.ftp_username, 0, 1)
        ftp_cred_layout.addWidget(QLabel("Passwort:"), 1, 0)
        self.ftp_password = QLineEdit()
        self.ftp_password.setEchoMode(QLineEdit.Password)
        ftp_cred_layout.addWidget(self.ftp_password, 1, 1)
        
        ftp_layout.addWidget(self.enable_ftp)
        ftp_layout.addLayout(ftp_port_layout)
        ftp_layout.addLayout(ftp_auth_layout)
        ftp_layout.addLayout(ftp_cred_layout)
        ftp_group.setLayout(ftp_layout)
        
        # Füge Gruppen zum Layout hinzu
        layout.addWidget(http_group)
        layout.addWidget(ftp_group)
        layout.addStretch()
        
        return page

    def _create_ntfs_page(self):
        """Create the NTFS drives settings page"""
        page = QWidget()
        layout = QVBoxLayout(page)
        
        # NTFS Drives Group
        ntfs_group = QGroupBox("NTFS-Laufwerke")
        ntfs_layout = QVBoxLayout(ntfs_group)
        
        # Drive list
        self.ntfs_list = QListWidget()
        ntfs_layout.addWidget(self.ntfs_list)
        
        # Options
        auto_integrate = QCheckBox("Automatisch in die Datenbank integrieren")
        offline_handling = QCheckBox("Offline-Laufwerke in der Datenbank behalten")
        ntfs_layout.addWidget(auto_integrate)
        ntfs_layout.addWidget(offline_handling)
        
        layout.addWidget(ntfs_group)
        layout.addStretch()
        return page

    def _create_refs_page(self):
        """Create the ReFS drives settings page"""
        page = QWidget()
        layout = QVBoxLayout(page)
        
        # ReFS Drives Group
        refs_group = QGroupBox("ReFS-Laufwerke")
        refs_layout = QVBoxLayout(refs_group)
        
        # Drive list
        self.refs_list = QListWidget()
        refs_layout.addWidget(self.refs_list)
        
        layout.addWidget(refs_group)
        layout.addStretch()
        return page

    def _create_folders_page(self):
        """Create the folders settings page"""
        page = QWidget()
        layout = QVBoxLayout(page)
        
        # Folders Group
        folders_group = QGroupBox("Ordner")
        folders_layout = QVBoxLayout(folders_group)
        
        # Folder list
        self.folder_list = QListWidget()
        folders_layout.addWidget(self.folder_list)
        
        # Buttons
        btn_layout = QHBoxLayout()
        add_btn = QPushButton("Hinzufügen...")
        remove_btn = QPushButton("Entfernen")
        btn_layout.addWidget(add_btn)
        btn_layout.addWidget(remove_btn)
        btn_layout.addStretch()
        folders_layout.addLayout(btn_layout)
        
        # Options
        monitor = QCheckBox("Ordner auf Änderungen überwachen")
        cache = QCheckBox("Ordner-Cache aktivieren")
        folders_layout.addWidget(monitor)
        folders_layout.addWidget(cache)
        
        layout.addWidget(folders_group)
        layout.addStretch()
        
        # Connect signals
        add_btn.clicked.connect(self._add_folder)
        remove_btn.clicked.connect(self._remove_folder)
        
        return page

    def _create_filelists_page(self):
        """Create the file lists settings page"""
        page = QWidget()
        layout = QVBoxLayout(page)
        
        # File Lists Group
        lists_group = QGroupBox("Dateilisten")
        lists_layout = QVBoxLayout(lists_group)
        
        # List widget
        self.file_lists = QListWidget()
        lists_layout.addWidget(self.file_lists)
        
        # Options
        auto_update = QCheckBox("Automatisch aktualisieren")
        lists_layout.addWidget(auto_update)
        
        layout.addWidget(lists_group)
        layout.addStretch()
        return page

    def _create_exclude_page(self):
        """Create the exclusion settings page"""
        page = QWidget()
        layout = QVBoxLayout(page)
        
        # Exclusion Group
        exclude_group = QGroupBox("Ein/Ausschluss")
        exclude_layout = QVBoxLayout(exclude_group)
        
        # Exclusion list
        self.exclude_list = QListWidget()
        exclude_layout.addWidget(self.exclude_list)
        
        # Buttons
        btn_layout = QHBoxLayout()
        add_btn = QPushButton("Hinzufügen...")
        remove_btn = QPushButton("Entfernen")
        btn_layout.addWidget(add_btn)
        btn_layout.addWidget(remove_btn)
        btn_layout.addStretch()
        exclude_layout.addLayout(btn_layout)
        
        layout.addWidget(exclude_group)
        layout.addStretch()
        return page

    def _create_etp_ftp_page(self):
        """Create the ETP/FTP server settings page"""
        page = QWidget()
        layout = QVBoxLayout(page)
        
        # ETP/FTP Server Group
        server_group = QGroupBox("ETP/FTP-Server")
        server_layout = QVBoxLayout(server_group)
        
        # Enable server
        enable_server = QCheckBox("ETP/FTP-Server aktivieren")
        server_layout.addWidget(enable_server)
        
        # Port settings
        port_layout = QHBoxLayout()
        port_label = QLabel("Port:")
        port_spin = QSpinBox()
        port_spin.setRange(1, 65535)
        port_spin.setValue(21)
        port_layout.addWidget(port_label)
        port_layout.addWidget(port_spin)
        port_layout.addStretch()
        server_layout.addLayout(port_layout)
        
        # Authentication
        auth_group = QGroupBox("Authentifizierung")
        auth_layout = QVBoxLayout(auth_group)
        
        username_layout = QHBoxLayout()
        username_label = QLabel("Benutzername:")
        username_edit = QLineEdit()
        username_layout.addWidget(username_label)
        username_layout.addWidget(username_edit)
        
        password_layout = QHBoxLayout()
        password_label = QLabel("Passwort:")
        password_edit = QLineEdit()
        password_edit.setEchoMode(QLineEdit.Password)
        password_layout.addWidget(password_label)
        password_layout.addWidget(password_edit)
        
        auth_layout.addLayout(username_layout)
        auth_layout.addLayout(password_layout)
        
        server_layout.addWidget(auth_group)
        layout.addWidget(server_group)
        layout.addStretch()
        return page

    def _create_http_page(self):
        """Create the HTTP server settings page"""
        page = QWidget()
        layout = QVBoxLayout(page)
        
        # HTTP Server Group
        server_group = QGroupBox("HTTP-Server")
        server_layout = QVBoxLayout(server_group)
        
        # Enable server
        enable_server = QCheckBox("HTTP-Server aktivieren")
        server_layout.addWidget(enable_server)
        
        # Port settings
        port_layout = QHBoxLayout()
        port_label = QLabel("Port:")
        port_spin = QSpinBox()
        port_spin.setRange(1, 65535)
        port_spin.setValue(80)
        port_layout.addWidget(port_label)
        port_layout.addWidget(port_spin)
        port_layout.addStretch()
        server_layout.addLayout(port_layout)
        
        # Authentication
        auth_group = QGroupBox("Authentifizierung")
        auth_layout = QVBoxLayout(auth_group)
        
        require_auth = QCheckBox("Authentifizierung erforderlich")
        auth_layout.addWidget(require_auth)
        
        username_layout = QHBoxLayout()
        username_label = QLabel("Benutzername:")
        username_edit = QLineEdit()
        username_layout.addWidget(username_label)
        username_layout.addWidget(username_edit)
        
        password_layout = QHBoxLayout()
        password_label = QLabel("Passwort:")
        password_edit = QLineEdit()
        password_edit.setEchoMode(QLineEdit.Password)
        password_layout.addWidget(password_label)
        password_layout.addWidget(password_edit)
        
        auth_layout.addLayout(username_layout)
        auth_layout.addLayout(password_layout)
        
        server_layout.addWidget(auth_group)
        layout.addWidget(server_group)
        layout.addStretch()
        return page

    def _on_tree_item_clicked(self, item, column):
        """Wird aufgerufen wenn ein Element im Tree ausgewählt wird"""
        # Ordne Tree-Items den entsprechenden Seiten zu
        item_text = item.text(0)
        
        # Handle main items
        if item_text == "Allgemein":
            self.stack.setCurrentWidget(self.general_page)
        elif item_text == "Bedienoberfläche":
            self.stack.setCurrentWidget(self.interface_page)
        elif item_text == "Suchstandards":
            self.stack.setCurrentWidget(self.search_page)
        elif item_text == "Suchfunktionen":
            self.stack.setCurrentWidget(self.search_functions_page)
        elif item_text == "Suchergebnisse":
            self.stack.setCurrentWidget(self.search_results_page)
        elif item_text == "Ansicht":
            self.stack.setCurrentWidget(self.view_page)
        elif item_text == "Kontextmenü":
            self.stack.setCurrentWidget(self.context_menu_page)
        elif item_text == "Schrift und Farbe":
            self.stack.setCurrentWidget(self.font_color_page)
        elif item_text == "Tastenbelegung":
            self.stack.setCurrentWidget(self.shortcuts_page)
        elif item_text == "Verlauf":
            self.stack.setCurrentWidget(self.history_page)
        elif item_text == "Datenbank":
            self.stack.setCurrentWidget(self.database_page)
        elif item_text == "Server":
            self.stack.setCurrentWidget(self.server_page)
            
        # Handle Database sub-items
        elif item_text == "NTFS-Laufwerke":
            self.stack.setCurrentWidget(self.ntfs_page)
        elif item_text == "ReFS-Laufwerke":
            self.stack.setCurrentWidget(self.refs_page)
        elif item_text == "Ordner":
            self.stack.setCurrentWidget(self.folders_page)
        elif item_text == "Dateilisten":
            self.stack.setCurrentWidget(self.filelists_page)
        elif item_text == "Ein/Ausschluss":
            self.stack.setCurrentWidget(self.exclude_page)
            
        # Handle Server sub-items
        elif item_text == "ETP/FTP-Server":
            self.stack.setCurrentWidget(self.etp_ftp_page)
        elif item_text == "HTTP-Server":
            self.stack.setCurrentWidget(self.http_page)

    def _load_settings(self):
        """Lädt die gespeicherten Einstellungen"""
        # Allgemein
        self.language_combo.setCurrentText(self.settings.value("general/language", "Deutsch (Systemstandard)"))
        self.store_appdata.setChecked(self.settings.value("general/store_appdata", True, bool))
        self.check_updates.setChecked(self.settings.value("general/check_updates", False, bool))
        self.start_with_windows.setChecked(self.settings.value("general/start_with_windows", True, bool))
        self.run_as_admin.setChecked(self.settings.value("general/run_as_admin", False, bool))
        self.use_service.setChecked(self.settings.value("general/use_service", True, bool))
        self.show_folder_context.setChecked(self.settings.value("general/show_folder_context", False, bool))
        self.create_startmenu.setChecked(self.settings.value("general/create_startmenu", True, bool))
        self.create_desktop.setChecked(self.settings.value("general/create_desktop", False, bool))
        self.create_taskbar.setChecked(self.settings.value("general/create_taskbar", False, bool))
        self.create_es_urls.setChecked(self.settings.value("general/create_es_urls", False, bool))
        self.create_efu.setChecked(self.settings.value("general/create_efu", True, bool))

    def _apply_settings(self):
        """Speichert die aktuellen Einstellungen"""
        # Allgemein
        self.settings.setValue("general/language", self.language_combo.currentText())
        self.settings.setValue("general/store_appdata", self.store_appdata.isChecked())
        self.settings.setValue("general/check_updates", self.check_updates.isChecked())
        self.settings.setValue("general/start_with_windows", self.start_with_windows.isChecked())
        self.settings.setValue("general/run_as_admin", self.run_as_admin.isChecked())
        self.settings.setValue("general/use_service", self.use_service.isChecked())
        self.settings.setValue("general/show_folder_context", self.show_folder_context.isChecked())
        self.settings.setValue("general/create_startmenu", self.create_startmenu.isChecked())
        self.settings.setValue("general/create_desktop", self.create_desktop.isChecked())
        self.settings.setValue("general/create_taskbar", self.create_taskbar.isChecked())
        self.settings.setValue("general/create_es_urls", self.create_es_urls.isChecked())
        self.settings.setValue("general/create_efu", self.create_efu.isChecked())
        
        self.settings.sync()

    def _get_available_drives(self):
        """Get list of available drives with their file system types"""
        try:
            drives = []
            drive_strings = win32api.GetLogicalDriveStrings()
            drive_list = drive_strings.split('\000')[:-1]
            
            for drive in drive_list:
                try:
                    volume_info = win32api.GetVolumeInformation(drive)
                    fs_type = volume_info[4]  # File system type
                    drive_type = win32file.GetDriveType(drive)
                    
                    # Only include fixed and removable drives
                    if drive_type in [win32file.DRIVE_FIXED, win32file.DRIVE_REMOVABLE]:
                        drives.append({
                            'letter': drive[0],  # Drive letter
                            'path': drive,       # Full path
                            'fs_type': fs_type,  # File system type
                            'type': 'Fixed' if drive_type == win32file.DRIVE_FIXED else 'Removable',
                            'label': volume_info[0] if volume_info[0] else f"Local Disk ({drive[0]}:)"
                        })
                except Exception as e:
                    print(f"Error getting info for drive {drive}: {e}")
                    continue
                    
            return drives
        except Exception as e:
            print(f"Error getting drives: {e}")
            return []

    def _populate_drive_lists(self):
        """Populate NTFS and ReFS drive lists"""
        drives = self._get_available_drives()
        
        # Clear existing items
        self.ntfs_drives_list.clear()
        self.refs_drives_list.clear()
        
        for drive in drives:
            item_text = f"{drive['label']} ({drive['letter']}:) - {drive['type']}"
            item = QListWidgetItem(item_text)
            
            # Store drive info in item data
            item.setData(Qt.UserRole, drive)
            
            # Add checkbox for NTFS drives
            if drive['fs_type'].upper() == 'NTFS':
                item.setFlags(item.flags() | Qt.ItemIsUserCheckable)
                item.setCheckState(Qt.Checked)  # Default to checked
                self.ntfs_drives_list.addItem(item)
            elif drive['fs_type'].upper() == 'REFS':
                item.setFlags(item.flags() | Qt.ItemIsUserCheckable)
                item.setCheckState(Qt.Checked)  # Default to checked
                self.refs_drives_list.addItem(item)

    def _update_drive_lists(self):
        """Update drive lists when settings change"""
        self._populate_drive_lists()
        
        # Update checkboxes based on settings
        for i in range(self.ntfs_drives_list.count()):
            item = self.ntfs_drives_list.item(i)
            drive_info = item.data(Qt.UserRole)
            is_checked = self.settings.value(f"database/ntfs_drive_{drive_info['letter']}", True, bool)
            item.setCheckState(Qt.Checked if is_checked else Qt.Unchecked)
            
        for i in range(self.refs_drives_list.count()):
            item = self.refs_drives_list.item(i)
            drive_info = item.data(Qt.UserRole)
            is_checked = self.settings.value(f"database/refs_drive_{drive_info['letter']}", True, bool)
            item.setCheckState(Qt.Checked if is_checked else Qt.Unchecked)

    def _save_drive_settings(self):
        """Save drive selection settings"""
        # Save NTFS drive settings
        for i in range(self.ntfs_drives_list.count()):
            item = self.ntfs_drives_list.item(i)
            drive_info = item.data(Qt.UserRole)
            is_checked = item.checkState() == Qt.Checked
            self.settings.setValue(f"database/ntfs_drive_{drive_info['letter']}", is_checked)
            
        # Save ReFS drive settings
        for i in range(self.refs_drives_list.count()):
            item = self.refs_drives_list.item(i)
            drive_info = item.data(Qt.UserRole)
            is_checked = item.checkState() == Qt.Checked
            self.settings.setValue(f"database/refs_drive_{drive_info['letter']}", is_checked)

    def _add_folder(self):
        """Open folder dialog and add selected folder to list"""
        folder = QFileDialog.getExistingDirectory(self, "Ordner auswählen")
        if folder:
            item = QListWidgetItem(folder)
            item.setFlags(item.flags() | Qt.ItemIsUserCheckable)
            item.setCheckState(Qt.Checked)
            self.folder_list.addItem(item)

    def _remove_folder(self):
        """Remove selected folder from list"""
        current_item = self.folder_list.currentItem()
        if current_item:
            self.folder_list.takeItem(self.folder_list.row(current_item)) 