import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import pygetwindow as gw
import pyautogui
import pyperclip
import time
import os
from pathlib import Path
import concurrent.futures
from PIL import Image, ImageTk
import subprocess  # Zum Öffnen von Dateien

class SearchApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Search Application")
        self.root.geometry("800x400")
        self.root.configure(bg='white')
        self.root.wm_attributes("-alpha", 0.9)

        self.active_filter = tk.StringVar(value="Wörter")
        self.settings = {
            "default_search_path": "C:/",
            "show_hidden_files": False
        }

        self.create_widgets()

    def create_widgets(self):
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        filter_frame = ttk.Frame(main_frame)
        filter_frame.grid(row=0, column=0, sticky="ns")
        filters = ["Wörter", "Zeichen", "Dateien", "Shortcuts"]
        for filter_name in filters:
            rb = ttk.Radiobutton(filter_frame, text=filter_name,
                                 variable=self.active_filter,
                                 value=filter_name,
                                 command=self.on_filter_change)
            rb.pack(anchor="w", pady=2)

        search_frame = ttk.Frame(main_frame)
        search_frame.grid(row=0, column=1, sticky="nsew", padx=(20, 0))
        main_frame.columnconfigure(1, weight=1)

        self.search_entry = ttk.Entry(search_frame, width=50)
        self.search_entry.pack(pady=5, anchor="ne")

        self.path_entry = ttk.Entry(search_frame, width=50)
        self.path_entry.pack(pady=5, anchor="ne")
        self.path_entry.insert(0, self.settings["default_search_path"])

        self.mode_frame = ttk.Frame(search_frame)
        self.mode_frame.pack(pady=5, anchor="ne")
        self.word_mode = tk.StringVar(value="search")
        self.search_mode_rb = ttk.Radiobutton(self.mode_frame, text="Search",
                                              variable=self.word_mode, value="search")
        self.count_mode_rb = ttk.Radiobutton(self.mode_frame, text="Count",
                                             variable=self.word_mode, value="count")
        self.search_mode_rb.pack(side=tk.LEFT)
        self.count_mode_rb.pack(side=tk.LEFT)

        self.search_button = ttk.Button(search_frame, text="Search", command=self.perform_search)
        self.search_button.pack(pady=5, anchor="ne")
        self.word_mode.trace_add("write", self.update_search_button)

        columns = ("Name", "Pfad", "Größe", "Geändert am")
        self.results_tree = ttk.Treeview(search_frame, columns=columns, show="headings", height=15)

        for col in columns:
            self.results_tree.heading(col, text=col)
            self.results_tree.column(col, width=150 if col == "Name" else 300 if col == "Pfad" else 100)

        self.results_tree.pack(pady=5, fill=tk.BOTH, expand=True)

        # Einstellungen Symbol
        try:
            settings_image = Image.open("settings_icon.png")
            settings_image = settings_image.resize((20, 20), Image.LANCZOS)
            self.settings_icon = ImageTk.PhotoImage(settings_image)

            self.settings_button = ttk.Button(main_frame, image=self.settings_icon, command=self.open_settings)
            self.settings_button.grid(row=1, column=0, sticky="sw", padx=5, pady=5)
        except FileNotFoundError:
            messagebox.showerror("Fehler", "Die Datei 'settings_icon.png' wurde nicht gefunden.")
            self.settings_button = ttk.Button(main_frame, text="Einstellungen", command=self.open_settings)
            self.settings_button.grid(row=1, column=0, sticky="sw", padx=5, pady=5)

        self.results_tree.bind("<Double-1>", self.open_file_explorer)

        self.on_filter_change()

    def on_filter_change(self):
        active_filter = self.active_filter.get()
        if active_filter == "Dateien":
            self.path_entry.pack(pady=5, anchor="ne")
            self.search_entry.pack(pady=5, anchor="ne")
            self.mode_frame.forget()
        elif active_filter == "Wörter":
            self.path_entry.forget()
            self.search_entry.pack(pady=5, anchor="ne")
            self.mode_frame.pack(pady=5, anchor="ne")
            self.update_search_button()
            if self.word_mode.get() == "count":
                self.search_entry.pack_forget()
            else:
                self.search_entry.pack(pady=5, anchor="ne")
        else:
            self.path_entry.forget()
            self.search_entry.pack(pady=5, anchor="ne")
            self.mode_frame.forget()
            self.search_button.config(text="Search")

    def update_search_button(self, *args):
        if self.active_filter.get() == "Wörter" and self.word_mode.get() == "count":
            self.search_button.config(text="Count")
            self.search_entry.pack_forget()
        else:
            self.search_button.config(text="Search")
            if self.active_filter.get() == "Wörter":
                self.search_entry.pack(pady=5, anchor="ne")

    def perform_search(self):
        for item in self.results_tree.get_children():
            self.results_tree.delete(item)

        active_filter = self.active_filter.get()
        query = self.search_entry.get().strip()

        if active_filter == "Dateien":
            search_path = self.path_entry.get().strip()
            if not query or not search_path:
                messagebox.showwarning("Eingabefehler", "Bitte geben Sie einen Suchbegriff und einen Suchpfad ein.")
                return
            results = self.search_files(search_path, query)
            if results:
                for file_info in results:
                    self.results_tree.insert("", tk.END, values=(
                        file_info["name"], file_info["path"], file_info["size"], file_info["modified_time"]))
            else:
                messagebox.showinfo("Keine Ergebnisse", f"Keine Dateien mit '{query}' gefunden.")

        elif active_filter in ["Wörter", "Zeichen", "Shortcuts"]:
            if active_filter == "Wörter" and self.word_mode.get() == "search" and not query:
                messagebox.showwarning("Eingabefehler", "Bitte geben Sie einen Suchbegriff ein.")
                return
            self.perform_text_search(query, active_filter)
        else:
            messagebox.showinfo("Nicht implementiert", f"Der Filter '{active_filter}' ist noch nicht implementiert.")

    def search_files(self, search_path, query):
        results = []

        try:
            with concurrent.futures.ThreadPoolExecutor() as executor:
                futures = []
                for root, _, files in os.walk(search_path):
                    for file in files:
                        file_path = os.path.join(root, file)
                        if not self.settings["show_hidden_files"] and os.path.basename(file).startswith("."):
                            continue
                        futures.append(executor.submit(self.check_file_and_get_info, file_path, query))

                for future in concurrent.futures.as_completed(futures):
                    result = future.result()
                    if result:
                        results.append(result)

        except Exception as e:
            messagebox.showerror("Fehler", f"Fehler beim Durchsuchen von Dateien: {e}")

        return results

    def check_file_and_get_info(self, file_path, query):
        try:
            if query.lower() in os.path.basename(file_path).lower():
                size = os.path.getsize(file_path)
                modified_time = time.strftime("%d.%m.%Y %H:%M:%S", time.localtime(os.path.getmtime(file_path)))

                return {
                    "name": os.path.basename(file_path),
                    "path": file_path,
                    "size": f"{size // 1024} KB",
                    "modified_time": modified_time
                }
            return None
        except Exception as e:
            print(f"Fehler beim Lesen von {file_path}: {e}")
            return None

    def perform_text_search(self, query, filter_type):
        windows = gw.getAllTitles()
        if not windows:
            messagebox.showinfo("Keine Ergebnisse", "Keine offenen Fenster gefunden.")
            return

        for window in windows:
            self.results_tree.insert("", tk.END, values=(window, "", "", ""))
        self.open_selection_window(windows, query, filter_type)

    def open_selection_window(self, windows, query, filter_type):
        sel_win = tk.Toplevel(self.root)
        sel_win.title("Fenster auswählen")
        sel_win.geometry("300x250")
        sel_win.wm_attributes("-alpha", 0.9)

        label = ttk.Label(sel_win, text="Wählen Sie ein Fenster aus, um die Aktion auszuführen:")
        label.pack(pady=5)

        listbox = tk.Listbox(sel_win, width=40, height=8)
        listbox.pack(pady=5, padx=5, fill=tk.BOTH, expand=True)

        for win in windows:
            listbox.insert(tk.END, win)

        select_button = ttk.Button(sel_win, text="Auswählen",
                                   command=lambda: self.on_window_select(listbox, query, sel_win, filter_type))
        select_button.pack(pady=5)

    def on_window_select(self, listbox, query, sel_win, filter_type):
        selection = listbox.curselection()
        if not selection:
            messagebox.showwarning("Auswahlfehler", "Bitte wählen Sie ein Fenster aus der Liste aus.")
            return

        window_title = listbox.get(selection[0])
        try:
            target_window = gw.getWindowsWithTitle(window_title)[0]
            target_window.activate()
            time.sleep(0.5)

            if filter_type == "Wörter":
                if self.word_mode.get() == "search":
                    pyautogui.hotkey('ctrl', 'f')
                    time.sleep(0.2)
                    pyperclip.copy(query)
                    pyautogui.hotkey('ctrl', 'v')
                    pyautogui.press('enter')
                elif self.word_mode.get() == "count":
                    # Beschränke die Wortzählung auf den Editor in VS Code
                    if "VS Code" in window_title:
                        pyautogui.hotkey('ctrl', 'a')  # Alles auswählen
                        time.sleep(0.2)
                        pyautogui.hotkey('ctrl', 'c')  # Kopieren
                        time.sleep(0.2)
                        text = pyperclip.paste()
                        words = text.split()
                        count = len(words)
                        self.results_tree.delete(*self.results_tree.get_children())
                        self.results_tree.insert("", tk.END, values=(f"Wortanzahl: {count}", "", "", ""))
                    else:
                        messagebox.showinfo("Hinweis", "Die Wortzählung ist auf den VS Code-Editor beschränkt.")
                    target_window.activate()
            elif filter_type == "Zeichen":
                pyautogui.hotkey('ctrl', 'f')
                time.sleep(0.2)
                pyperclip.copy(query)
                pyautogui.hotkey('ctrl', 'v')
                pyautogui.press('enter')
            elif filter_type == "Shortcuts":
                command = query
                result = "nicht gefunden"
                for app_key, commands in self.shortcut_mappings.items():
                    if app_key.lower() in window_title.lower():
                        for cmd, shortcut in commands.items():
                            if cmd.lower() == command.lower():
                                result = shortcut
                                break
                        break
                self.results_tree.delete(*self.results_tree.get_children())
                self.results_tree.insert("", tk.END, values=(result, "", "", ""))

            sel_win.destroy()
        except Exception as e:
            messagebox.showerror("Fehler",
                                 f"Konnte die Aktion im ausgewählten Fenster nicht ausführen.\n{e}")

    def open_settings(self):
        settings_window = tk.Toplevel(self.root)
        settings_window.title("Einstellungen")
        settings_window.geometry("300x200")
        settings_window.wm_attributes("-alpha", 0.9)

        default_path_label = ttk.Label(settings_window, text="Standard Suchpfad:")
        default_path_label.pack(pady=5)
        default_path_entry = ttk.Entry(settings_window, width=30)
        default_path_entry.pack(pady=5)
        default_path_entry.insert(0, self.settings["default_search_path"])

        show_hidden_var = tk.BooleanVar(value=self.settings["show_hidden_files"])
        show_hidden_check = ttk.Checkbutton(settings_window, text="Versteckte Dateien anzeigen",
                                            variable=show_hidden_var)
        show_hidden_check.pack(pady=5)

        def save_settings():
            self.settings["default_search_path"] = default_path_entry.get()
            self.settings["show_hidden_files"] = show_hidden_var.get()
            self.path_entry.delete(0, tk.END)
            self.path_entry.insert(0, self.settings["default_search_path"])
            settings_window.destroy()

        save_button = ttk.Button(settings_window, text="Speichern", command=save_settings)
        save_button.pack(pady=10)

    def open_file_explorer(self, event):
        item = self.results_tree.selection()[0]
        file_path = self.results_tree.item(item, "values")[1]
        try:
            # Öffne den Ordner, in dem sich die Datei befindet, und wähle die Datei aus
            subprocess.Popen(f'explorer /select,"{file_path}"')
        except Exception as e:
            messagebox.showerror("Fehler", f"Konnte Datei nicht öffnen: {e}")


root = tk.Tk()

app = SearchApp(root)
root.mainloop()
