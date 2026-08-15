import tkinter as tk
from tkinter import ttk, messagebox
import pygetwindow as gw
import pyautogui
import time

class SearchApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Search Application")
        self.root.geometry("500x200")
        self.root.configure(bg='white')
        # Set a bit of transparency for a modern look
        self.root.wm_attributes("-alpha", 0.9)
        
        # Only one filter active at a time
        self.active_filter = tk.StringVar(value="Wörter")
        self.create_widgets()
        
    def create_widgets(self):
        # Main container with two columns: left for filters, right for search and results.
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Left column: filters
        filter_frame = ttk.Frame(main_frame)
        filter_frame.grid(row=0, column=0, sticky="ns")
        filters = ["Wörter", "Zeichen", "Dateien", "Shortcuts"]
        for filter_name in filters:
            rb = ttk.Radiobutton(filter_frame, text=filter_name,
                                 variable=self.active_filter,
                                 value=filter_name)
            rb.pack(anchor="w", pady=2)
        
        # Right column: search field and results list
        search_frame = ttk.Frame(main_frame)
        search_frame.grid(row=0, column=1, sticky="nsew", padx=(20,0))
        main_frame.columnconfigure(1, weight=1)
        
        self.search_entry = ttk.Entry(search_frame, width=30)
        self.search_entry.pack(pady=5, anchor="ne")
        
        search_button = ttk.Button(search_frame, text="Search", command=self.perform_search)
        search_button.pack(pady=5, anchor="ne")
        
        self.results_list = tk.Listbox(search_frame, width=40, height=6)
        self.results_list.pack(pady=5, anchor="ne", fill=tk.BOTH, expand=True)
        
    def perform_search(self):
        query = self.search_entry.get().strip()
        if not query:
            messagebox.showwarning("Input Error", "Please enter a search term.")
            return
        
        # Clear previous results
        self.results_list.delete(0, tk.END)
        
        if self.active_filter.get() == "Wörter":
            # List all open windows regardless of the query.
            windows = gw.getAllTitles()
            if not windows:
                messagebox.showinfo("No Results", "No open windows found.")
                return
                
            for window in windows:
                self.results_list.insert(tk.END, window)
                
            # Open a new selection window with all open windows.
            self.open_selection_window(windows, query)
        else:
            # Other filters are not yet implemented.
            messagebox.showinfo("Not Implemented", 
                                f"The filter '{self.active_filter.get()}' is not implemented yet.")
    
    def open_selection_window(self, windows, query):
        # Create a new window for the user to choose from the open windows.
        sel_win = tk.Toplevel(self.root)
        sel_win.title("Select Window")
        sel_win.geometry("300x250")
        sel_win.wm_attributes("-alpha", 0.9)
        
        label = ttk.Label(sel_win, text="Select a window to highlight the search term:")
        label.pack(pady=5)
        
        listbox = tk.Listbox(sel_win, width=40, height=8)
        listbox.pack(pady=5, padx=5, fill=tk.BOTH, expand=True)
        
        for win in windows:
            listbox.insert(tk.END, win)
            
        # Add a "Select" button to confirm the chosen window.
        select_button = ttk.Button(sel_win, text="Select",
                                   command=lambda: self.on_window_select(listbox, query, sel_win))
        select_button.pack(pady=5)
        
    def on_window_select(self, listbox, query, sel_win):
        selection = listbox.curselection()
        if selection:
            window_title = listbox.get(selection[0])
            try:
                # Activate the selected window.
                target_window = gw.getWindowsWithTitle(window_title)[0]
                target_window.activate()
                # Give the window time to come to the front.
                time.sleep(0.5)
                # Simulate the find function (CTRL+F) to highlight the searched word.
                pyautogui.hotkey('ctrl', 'f')
                time.sleep(0.2)
                pyautogui.write(query)
                pyautogui.press('enter')
                sel_win.destroy()
            except Exception as e:
                messagebox.showerror("Error", f"Could not highlight text in the selected window.\n{e}")
        else:
            messagebox.showwarning("Selection Error", "Please select a window from the list.")

def on_activate(event):
    root.deiconify()

# Hide the main window on start; it only shows when CTRL+M (STRG+M) is pressed.
root = tk.Tk()
root.withdraw()
root.bind('<Control-m>', on_activate)

app = SearchApp(root)
root.mainloop()
