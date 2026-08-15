import tkinter as tk
from tkinter import ttk, messagebox
import pygetwindow as gw
import pyautogui
import pyperclip
import time

class SearchApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Search Application")
        self.root.geometry("500x300")
        self.root.configure(bg='white')
        # Modern transparent look
        self.root.wm_attributes("-alpha", 0.9)
        
        # Only one filter active at a time.
        self.active_filter = tk.StringVar(value="Wörter")
        
        # Predefined shortcut mappings.
        # The keys should be substrings expected in the target window title.
        # The inner dictionary maps commands (as typed in the search field) to the shortcut string.
        self.shortcut_mappings = {
            "VS Code": {
                "code ausführen": "Ctrl+Alt+N",
                "build project": "Ctrl+Shift+B",
            },
            # Add additional mappings for other applications as needed.
        }
        
        self.create_widgets()
        
    def create_widgets(self):
        # Main container with two columns: left for filters, right for search, mode and results.
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Left column: filters.
        filter_frame = ttk.Frame(main_frame)
        filter_frame.grid(row=0, column=0, sticky="ns")
        filters = ["Wörter", "Zeichen", "Dateien", "Shortcuts"]
        for filter_name in filters:
            rb = ttk.Radiobutton(filter_frame, text=filter_name,
                                 variable=self.active_filter,
                                 value=filter_name,
                                 command=self.on_filter_change)
            rb.pack(anchor="w", pady=2)
        
        # Right column: search field, mode selection (for Wörter) and results.
        search_frame = ttk.Frame(main_frame)
        search_frame.grid(row=0, column=1, sticky="nsew", padx=(20,0))
        main_frame.columnconfigure(1, weight=1)
        
        self.search_entry = ttk.Entry(search_frame, width=30)
        self.search_entry.pack(pady=5, anchor="ne")
        
        # Mode selection for the "Wörter" filter: Search vs. Count.
        # This panel is shown only when the Wörter filter is active.
        self.mode_frame = ttk.Frame(search_frame)
        self.mode_frame.pack(pady=5, anchor="ne")
        self.word_mode = tk.StringVar(value="search")
        self.search_mode_rb = ttk.Radiobutton(self.mode_frame, text="Search",
                                              variable=self.word_mode, value="search")
        self.count_mode_rb = ttk.Radiobutton(self.mode_frame, text="Count",
                                             variable=self.word_mode, value="count")
        self.search_mode_rb.pack(side=tk.LEFT)
        self.count_mode_rb.pack(side=tk.LEFT)
        
        # Search/Count button.
        self.search_button = ttk.Button(search_frame, text="Search", command=self.perform_search)
        self.search_button.pack(pady=5, anchor="ne")
        self.word_mode.trace_add("write", self.update_search_button)
        
        # Results list.
        self.results_list = tk.Listbox(search_frame, width=40, height=6)
        self.results_list.pack(pady=5, anchor="ne", fill=tk.BOTH, expand=True)
        
        self.on_filter_change()  # Update UI based on initial filter
        
    def on_filter_change(self):
        # When switching filters, show/hide the mode selection panel.
        if self.active_filter.get() == "Wörter":
            self.mode_frame.pack(pady=5, anchor="ne")
            self.update_search_button()
        else:
            # For other filters (e.g., Shortcuts), hide the mode panel.
            self.mode_frame.forget()
            self.search_button.config(text="Search")
    
    def update_search_button(self, *args):
        # Change button text based on the Wörter mode.
        if self.active_filter.get() == "Wörter" and self.word_mode.get() == "count":
            self.search_button.config(text="Count")
        else:
            self.search_button.config(text="Search")
        
    def perform_search(self):
        # For Wörter filter in search mode, require a search term.
        if self.active_filter.get() == "Wörter" and self.word_mode.get() == "search":
            query = self.search_entry.get().strip()
            if not query:
                messagebox.showwarning("Input Error", "Please enter a search term.")
                return
        elif self.active_filter.get() == "Shortcuts":
            # For Shortcuts, require a command.
            query = self.search_entry.get().strip()
            if not query:
                messagebox.showwarning("Input Error", "Please enter a command for the shortcut.")
                return
        else:
            # For Wörter count mode, we ignore the search entry.
            query = None
        
        # Clear previous results.
        self.results_list.delete(0, tk.END)
        
        # For both Wörter and Shortcuts, list all open windows.
        if self.active_filter.get() in ["Wörter", "Shortcuts"]:
            windows = gw.getAllTitles()
            if not windows:
                messagebox.showinfo("No Results", "No open windows found.")
                return
            # Populate the results list with window titles.
            for window in windows:
                self.results_list.insert(tk.END, window)
            # Open a selection window to choose the target window.
            self.open_selection_window(windows, query)
        else:
            messagebox.showinfo("Not Implemented", 
                                f"The filter '{self.active_filter.get()}' is not implemented yet.")
    
    def open_selection_window(self, windows, query):
        # Create a new window for the user to choose an open window.
        sel_win = tk.Toplevel(self.root)
        sel_win.title("Select Window")
        sel_win.geometry("300x250")
        sel_win.wm_attributes("-alpha", 0.9)
        
        label = ttk.Label(sel_win, text="Select a window to perform the action:")
        label.pack(pady=5)
        
        listbox = tk.Listbox(sel_win, width=40, height=8)
        listbox.pack(pady=5, padx=5, fill=tk.BOTH, expand=True)
        
        for win in windows:
            listbox.insert(tk.END, win)
            
        select_button = ttk.Button(sel_win, text="Select",
                                   command=lambda: self.on_window_select(listbox, query, sel_win))
        select_button.pack(pady=5)
        
    def on_window_select(self, listbox, query, sel_win):
        selection = listbox.curselection()
        if not selection:
            messagebox.showwarning("Selection Error", "Please select a window from the list.")
            return
        window_title = listbox.get(selection[0])
        try:
            target_window = gw.getWindowsWithTitle(window_title)[0]
            target_window.activate()
            time.sleep(0.5)
            
            if self.active_filter.get() == "Wörter":
                if self.word_mode.get() == "search":
                    # Open find dialog and paste search term (using clipboard for special characters).
                    pyautogui.hotkey('ctrl', 'f')
                    time.sleep(0.2)
                    pyperclip.copy(self.search_entry.get().strip())
                    pyautogui.hotkey('ctrl', 'v')
                    pyautogui.press('enter')
                elif self.word_mode.get() == "count":
                    # Count mode: select all text, copy it, count words and update results.
                    pyautogui.hotkey('ctrl', 'a')
                    time.sleep(0.3)
                    pyautogui.hotkey('ctrl', 'c')
                    time.sleep(0.3)
                    text = pyperclip.paste()
                    words = text.split()
                    count = len(words)
                    self.results_list.delete(0, tk.END)
                    self.results_list.insert(tk.END, f"Word Count: {count}")
                    # Keep the target window in focus.
                    target_window.activate()
            elif self.active_filter.get() == "Shortcuts":
                # Lookup the shortcut command for the selected window.
                command = self.search_entry.get().strip()
                result = "not found"
                for app_key, commands in self.shortcut_mappings.items():
                    if app_key.lower() in window_title.lower():
                        for cmd, shortcut in commands.items():
                            if cmd.lower() == command.lower():
                                result = shortcut
                                break
                        break
                self.results_list.delete(0, tk.END)
                self.results_list.insert(tk.END, result)
            sel_win.destroy()
        except Exception as e:
            messagebox.showerror("Error", f"Could not perform action in the selected window.\n{e}")

def on_activate(event):
    root.deiconify()

# Hide the main window on start; it only shows when CTRL+M (STRG+M) is pressed.
root = tk.Tk()
root.withdraw()
root.bind('<Control-m>', on_activate)

app = SearchApp(root)
root.mainloop()
