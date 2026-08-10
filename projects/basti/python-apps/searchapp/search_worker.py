# search_worker.py
from PyQt5.QtCore import QThread, pyqtSignal
from datetime import datetime
from typing import List, Dict, Optional
import logging
from file_searcher import FileSearcher

class SearchWorker(QThread):
    """
    A QThread-based worker for performing file searches in the background.
    
    Signals:
        finished (pyqtSignal): Emitted when search is complete with results and error
        progress (pyqtSignal): Emitted with progress updates
        status (pyqtSignal): Emitted with status messages
    """
    
    finished = pyqtSignal(list, str)  # results, error
    progress = pyqtSignal(int)  # total files processed
    status = pyqtSignal(str)  # status messages

    def __init__(self, query: str, ext: str = "", show_hidden: bool = True,
                 min_size: int = 0, max_size: Optional[int] = None,
                 modified_after: Optional[datetime] = None,
                 modified_before: Optional[datetime] = None,
                 max_depth: Optional[int] = None):
        """
        Initialize the SearchWorker with search parameters.
        
        Args:
            query (str): Search pattern
            ext (str): File extension filter
            show_hidden (bool): Include hidden files
            min_size (int): Minimum file size
            max_size (Optional[int]): Maximum file size
            modified_after (Optional[datetime]): Files modified after this date
            modified_before (Optional[datetime]): Files modified before this date
            max_depth (Optional[int]): Maximum directory depth
        """
        super().__init__()
        self.query = query
        self.ext = ext
        self.show_hidden = show_hidden
        self.min_size = min_size
        self.max_size = max_size
        self.modified_after = modified_after
        self.modified_before = modified_before
        self.max_depth = max_depth
        self._is_cancelled = False

    def run(self):
        """Execute the search operation."""
        self.status.emit("Starting search...")
        self._is_cancelled = False
        
        try:
            searcher = FileSearcher(show_hidden=self.show_hidden, max_depth=self.max_depth)
            results, error = searcher.search_files(
                query=self.query,
                ext=self.ext,
                min_size=self.min_size,
                max_size=self.max_size,
                modified_after=self.modified_after,
                modified_before=self.modified_before
            )
            
            if self._is_cancelled:
                self.status.emit("Search cancelled")
                return
                
            if error:
                self.status.emit(f"Search completed with error: {error}")
            else:
                self.status.emit(f"Search completed. Found {len(results)} files.")
                
            self.finished.emit(results, error)
            
        except Exception as e:
            logging.error(f"Search worker error: {e}")
            self.status.emit(f"Error during search: {str(e)}")
            self.finished.emit([], str(e))

    def cancel(self):
        """Cancel the ongoing search operation."""
        self._is_cancelled = True
        self.status.emit("Cancelling search...") 