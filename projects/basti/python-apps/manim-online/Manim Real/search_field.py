import tkinter as tk
from tkinter import ttk

class SearchApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Beispiel: Strg+F Suche")
        self.geometry("600x400")

        # Hauptinhalt: Einfaches Textfeld
        self.text_area = tk.Text(self, wrap="word")
        self.text_area.pack(expand=True, fill="both")
        self.text_area.insert(
            "1.0", 
            "Hier steht ein Beispieltext.\n"
            "Du kannst etwas eingeben und mit Strg+F (oder Cmd+F) das Suchoverlay öffnen.\n"
            "Probiere z.B. nach 'Beispieltext' oder 'Wörter' zu suchen.\n"
        )

        # Tastenkombinationen (Strg+F oder Cmd+F auf Mac) abfangen
        self.bind_all("<Control-f>", self.open_search_overlay)
        self.bind_all("<Command-f>", self.open_search_overlay)

        # Das Overlay-Fenster (Suchfenster) vorbereiten (zuerst unsichtbar)
        self.overlay = tk.Toplevel(self)
        self.overlay.title("Suchoverlay")
        self.overlay.geometry("400x200")
        self.overlay.attributes("-topmost", True)  # Immer im Vordergrund
        self.overlay.withdraw()                    # Zunächst ausgeblendet

        # Radiobutton-Auswahl (nur eine Option möglich)
        self.search_option = tk.StringVar(value="Shortcuts")

        frame_filters = ttk.Frame(self.overlay)
        frame_filters.pack(side="left", fill="y", padx=10, pady=10)

        ttk.Radiobutton(
            frame_filters, 
            text="Shortcuts", 
            variable=self.search_option, 
            value="Shortcuts"
        ).pack(anchor="w")

        ttk.Radiobutton(
            frame_filters, 
            text="Wörter", 
            variable=self.search_option, 
            value="Wörter"
        ).pack(anchor="w")

        ttk.Radiobutton(
            frame_filters, 
            text="Ausführungen", 
            variable=self.search_option, 
            value="Ausführungen"
        ).pack(anchor="w")

        # Rechte Spalte: Suchfeld + Buttons
        frame_search = ttk.Frame(self.overlay)
        frame_search.pack(side="right", expand=True, fill="both", padx=10, pady=10)

        self.search_entry = ttk.Entry(frame_search)
        self.search_entry.pack(fill="x", pady=5)

        frame_buttons = ttk.Frame(frame_search)
        frame_buttons.pack(side="bottom", anchor="e")

        btn_search = ttk.Button(frame_buttons, text="Suchen", command=self.search)
        btn_search.pack(side="left", padx=5)

        btn_close = ttk.Button(frame_buttons, text="Schließen", command=self.close_search_overlay)
        btn_close.pack(side="left", padx=5)

        # Highlight-Tag vorbereiten
        self.text_area.tag_config("highlight", background="yellow")

    def open_search_overlay(self, event=None):
        """Zeigt das Suchfenster an."""
        self.overlay.deiconify()
        self.overlay.grab_set()
        self.search_entry.focus()

    def close_search_overlay(self):
        """Versteckt das Suchfenster."""
        self.overlay.withdraw()
        self.grab_release()

    def search(self):
        """Sucht wirklich nach dem eingegebenen Wort und hebt alle Vorkommen hervor."""
        query = self.search_entry.get().strip()
        selected_option = self.search_option.get()

        # Falls nichts eingegeben wurde -> abbrechen
        if not query:
            return

        # Erstmal alle alten Highlights entfernen
        self.text_area.tag_remove("highlight", "1.0", tk.END)

        # Zeige in der Konsole an, was gewählt wurde (optional)
        print(f"Gewählte Option: {selected_option}, Suchbegriff: {query}")

        # Einfache Textsuche im gesamten Text
        start_pos = "1.0"
        while True:
            # .search() liefert die erste Fundstelle ab start_pos (oder "" wenn nichts mehr)
            idx = self.text_area.search(query, start_pos, stopindex=tk.END)
            if not idx:  # Keine Fundstelle mehr
                break

            # Ende der Fundstelle berechnen
            end_pos = f"{idx}+{len(query)}c"

            # Fundstelle markieren
            self.text_area.tag_add("highlight", idx, end_pos)

            # Nächste Suche beginnt hinter dem aktuellen Fundende
            start_pos = end_pos

if __name__ == "__main__":
    app = SearchApp()
    app.mainloop()
