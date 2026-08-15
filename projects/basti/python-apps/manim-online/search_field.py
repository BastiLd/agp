import tkinter as tk
from tkinter import ttk, messagebox
import os

# Versuche, pygetwindow zu importieren (liefert Fenster-Titel)
try:
    import pygetwindow as gw
except ImportError:
    gw = None

# Versuche, pywinauto zu importieren (liefert evtl. Textinhalt aus Fenstern)
try:
    from pywinauto import Desktop
except ImportError:
    Desktop = None


class SearchApp(tk.Tk):
    def __init__(self):
        super().__init__()
        # Hauptfenster verbergen – erst das Overlay soll sichtbar werden.
        self.withdraw()
        self.title("Global Search")
        self.geometry("600x400")

        # Standard-Einstellungen
        self.selected_theme = "Light"
        self.show_only_open_windows = True
        self.only_window_name = False  # Falls True: Nur den Fensternamen anzeigen

        # Modernes Erscheinungsbild über ein ttk-Theme
        style = ttk.Style(self)
        style.theme_use("clam")

        # Erstelle das Such-Overlay als Toplevel-Fenster
        self.overlay = tk.Toplevel(self)
        self.overlay.title("Suchoverlay")
        self.overlay.geometry("500x350")
        self.overlay.attributes("-topmost", True)
        self.overlay.withdraw()  # zunächst unsichtbar

        # Linke Seite: Filter-Auswahl (Radiobuttons)
        self.search_option = tk.StringVar(value="Shortcuts")
        frame_filters = ttk.Frame(self.overlay)
        frame_filters.pack(side="left", fill="y", padx=10, pady=10)
        ttk.Radiobutton(frame_filters, text="Shortcuts", variable=self.search_option, value="Shortcuts").pack(
            anchor="w", pady=2)
        ttk.Radiobutton(frame_filters, text="Wörter & Zeichen", variable=self.search_option, value="Wörter").pack(
            anchor="w", pady=2)
        ttk.Radiobutton(frame_filters, text="Ausführungen", variable=self.search_option, value="Ausführungen").pack(
            anchor="w", pady=2)
        ttk.Radiobutton(frame_filters, text="Dateien", variable=self.search_option, value="Dateien").pack(anchor="w",
                                                                                                          pady=2)

        # Rechte Seite: Suchfeld, Fenster-Auswahl, Ergebnisanzeige und Buttons
        frame_search = ttk.Frame(self.overlay)
        frame_search.pack(side="right", expand=True, fill="both", padx=10, pady=10)

        ttk.Label(frame_search, text="Fenster auswählen:").pack(anchor="w")
        self.window_var = tk.StringVar()
        self.window_combo = ttk.Combobox(frame_search, textvariable=self.window_var, state="readonly")
        self.window_combo.pack(fill="x", pady=5)

        ttk.Label(frame_search, text="Suchbegriff:").pack(anchor="w")
        self.search_entry = ttk.Entry(frame_search, font=("Segoe UI", 12))
        self.search_entry.pack(fill="x", pady=5)
        self.search_entry.bind("<Return>", lambda event: self.search())

        self.results_label = ttk.Label(frame_search, text="", background="#f0f0f0", anchor="w", justify="left",
                                       wraplength=400)
        self.results_label.pack(fill="both", pady=5, expand=True)

        btn_frame = ttk.Frame(frame_search)
        btn_frame.pack(side="bottom", fill="x", pady=5)
        ttk.Button(btn_frame, text="Suchen", command=self.search).pack(side="left", padx=5)
        ttk.Button(btn_frame, text="Schließen", command=self.close_overlay).pack(side="right", padx=5)

        # Einstellungen: Einstellungs-Icon unten links
        self.create_settings_icon()

        # Globale Hotkey-Bindung: Strg+F / Cmd+F öffnet das Overlay
        self.bind_all("<Control-f>", self.open_overlay)
        self.bind_all("<Command-f>", self.open_overlay)

    def create_settings_icon(self):
        settings_button = ttk.Button(self.overlay, text="⚙️", command=self.open_settings)
        settings_button.place(x=10, y=320)

    def open_settings(self):
        settings_window = tk.Toplevel(self.overlay)
        settings_window.title("Einstellungen")
        settings_window.geometry("300x250")

        # Option: Nur offene Fenster anzeigen
        ttk.Label(settings_window, text="Fensterauflistung:").pack(anchor="w", padx=10, pady=5)
        self.show_windows_var = tk.BooleanVar(value=self.show_only_open_windows)
        ttk.Checkbutton(settings_window, text="Nur offene Fenster anzeigen", variable=self.show_windows_var).pack(
            anchor="w", padx=10)

        # Option: Nur den Fensternamen anzeigen (statt Textinhalt auslesen)
        ttk.Label(settings_window, text="Fensterinhalt:").pack(anchor="w", padx=10, pady=5)
        self.only_name_var = tk.BooleanVar(value=self.only_window_name)
        ttk.Checkbutton(settings_window, text="Nur Fenstername anzeigen", variable=self.only_name_var).pack(anchor="w",
                                                                                                            padx=10)

        # Design auswählen (5 moderne Looks)
        ttk.Label(settings_window, text="Design auswählen:").pack(anchor="w", padx=10, pady=5)
        themes = ["Light", "Dark", "Blue", "Gray", "Modern"]
        self.theme_var = tk.StringVar(value=self.selected_theme)
        ttk.Combobox(settings_window, textvariable=self.theme_var, values=themes, state="readonly").pack(fill="x",
                                                                                                         padx=10)

        ttk.Button(settings_window, text="Speichern", command=self.save_settings).pack(pady=10)

    def save_settings(self):
        self.selected_theme = self.theme_var.get()
        self.show_only_open_windows = self.show_windows_var.get()
        self.only_window_name = self.only_name_var.get()
        self.apply_theme()
        self.update_window_list()
        messagebox.showinfo("Einstellungen", "Änderungen wurden übernommen.")

    def apply_theme(self):
        # Ändere das gesamte Overlay-Erscheinungsbild anhand des gewählten Designs
        if self.selected_theme == "Dark":
            self.overlay.configure(bg="#2e2e2e")
        elif self.selected_theme == "Blue":
            self.overlay.configure(bg="#003366")
        elif self.selected_theme == "Gray":
            self.overlay.configure(bg="#808080")
        elif self.selected_theme == "Modern":
            self.overlay.configure(bg="#222831")
        else:
            self.overlay.configure(bg="#f0f0f0")
        # Hier könnten weitere Style-Änderungen (Schriftarten, Rahmen, etc.) erfolgen.

    def update_window_list(self):
        if gw:
            titles = gw.getAllTitles()
            if self.show_only_open_windows:
                titles = [t for t in titles if t.strip()]
            self.window_combo["values"] = titles if titles else ["Keine offenen Fenster"]
            if titles:
                self.window_combo.current(0)
            else:
                self.window_combo.set("Keine offenen Fenster")
        else:
            self.window_combo["values"] = []
            self.window_combo.set("pygetwindow nicht installiert")

    def open_overlay(self, event=None):
        self.update_window_list()
        self.overlay.deiconify()
        self.overlay.grab_set()
        self.search_entry.focus_set()

    def close_overlay(self):
        self.overlay.grab_release()
        self.overlay.withdraw()

    def search(self):
        query = self.search_entry.get().strip()
        option = self.search_option.get()
        results = []

        if not query:
            self.results_label.config(text="Bitte einen Suchbegriff eingeben.")
            return

        self.results_label.config(text="")

        if option == "Dateien":
            current_dir = os.getcwd()
            try:
                files = os.listdir(current_dir)
            except Exception:
                files = []
            matching_files = [f for f in files if query.lower() in f.lower()]
            if matching_files:
                result_text = "Gefundene Dateien:\n" + "\n".join(matching_files[:5])
            else:
                result_text = "Keine Dateien gefunden."
            self.results_label.config(text=result_text)
            return

        selected_window = self.window_var.get()
        window_text = ""
        if self.only_window_name or not (Desktop and selected_window):
            # Wenn nur der Name angezeigt werden soll oder pywinauto nicht verfügbar ist,
            # verwende einfach den Fenstertitel.
            window_text = selected_window
        else:
            try:
                app = Desktop(backend="uia").window(title=selected_window)
                try:
                    # Versuche, den Text eines Edit-Controls auszulesen (z. B. Notepad, WordPad)
                    edit = app.child_window(control_type="Edit")
                    window_text = edit.wrapper_object().window_text()
                except Exception:
                    window_text = app.window_text()
            except Exception:
                window_text = ""

        if not window_text:
            # Fallback: wenn kein Textinhalt ausgelesen werden konnte, verwende den Fenstertitel
            window_text = selected_window

        # Zerlege den Text in Zeilen und sammle Zeilen, die den Suchbegriff enthalten
        lines = window_text.splitlines()
        for line in lines:
            if query.lower() in line.lower():
                results.append(line.strip())

        if results:
            result_text = "Top Ergebnisse:\n" + "\n".join(results[:5])
        else:
            result_text = "Keine Treffer gefunden."

        self.results_label.config(text=result_text)


if __name__ == "__main__":
    app = SearchApp()
    app.mainloop()
