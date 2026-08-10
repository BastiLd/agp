# file_searcher.py
import os
from datetime import datetime
from pathlib import Path
import re
from typing import List, Dict, Optional, Tuple
import logging

class FileSearcher:
    """
    A class for searching files with various filtering options.
    
    Attributes:
        roots (List[str]): List of root directories to search in
        show_hidden (bool): Whether to include hidden files in search results
        max_depth (Optional[int]): Maximum directory depth to search (None for unlimited)
    """
    
    def __init__(self, show_hidden: bool = True, max_depth: Optional[int] = None):
        """
        Initialize the FileSearcher with search parameters.
        
        Args:
            show_hidden (bool): Whether to include hidden files
            max_depth (Optional[int]): Maximum directory depth to search
        """
        if os.name == 'nt':
            self.roots = [str(Path.home()), "C:\\\\"]
        else:
            self.roots = ["/"]
        self.show_hidden = show_hidden
        self.max_depth = max_depth

    def _should_skip_directory(self, dirpath: str) -> bool:
        """
        Determine if a directory should be skipped based on hidden status and depth.
        
        Args:
            dirpath (str): Path to the directory
            
        Returns:
            bool: True if directory should be skipped
        """
        if not self.show_hidden and any(p.startswith('.') for p in Path(dirpath).parts):
            return True
            
        if self.max_depth is not None:
            depth = len(Path(dirpath).parts) - len(Path(self.roots[0]).parts)
            if depth > self.max_depth:
                return True
        return False

    def search_files(self, query: str, ext: str = "", 
                    min_size: int = 0, max_size: Optional[int] = None,
                    modified_after: Optional[datetime] = None,
                    modified_before: Optional[datetime] = None) -> Tuple[List[Dict], Optional[str]]:
        """
        Search for files matching the given criteria.
        
        Args:
            query (str): Search pattern (supports wildcards * and ?)
            ext (str): File extension to filter by
            min_size (int): Minimum file size in bytes
            max_size (Optional[int]): Maximum file size in bytes
            modified_after (Optional[datetime]): Only files modified after this date
            modified_before (Optional[datetime]): Only files modified before this date
            
        Returns:
            Tuple[List[Dict], Optional[str]]: List of matching files and error message if any
        """
        results = []
        error = None
        pattern = re.compile("^" + re.escape(query).replace(r"\*", ".*").replace(r"\?", ".") + "$", 
                           re.IGNORECASE)
        
        try:
            for root in self.roots:
                for dirpath, _, files in os.walk(root):
                    if self._should_skip_directory(dirpath):
                        continue
                        
                    for name in files:
                        if not pattern.match(name):
                            continue
                            
                        if ext and not name.endswith(f".{ext}"):
                            continue
                            
                        path = os.path.join(dirpath, name)
                        try:
                            stats = os.stat(path)
                            
                            # Check file size
                            if stats.st_size < min_size:
                                continue
                            if max_size is not None and stats.st_size > max_size:
                                continue
                                
                            # Check modification time
                            modified = datetime.fromtimestamp(stats.st_mtime)
                            if modified_after and modified < modified_after:
                                continue
                            if modified_before and modified > modified_before:
                                continue
                                
                            results.append({
                                "filename": name,
                                "path": path,
                                "size": stats.st_size,
                                "modified": modified,
                                "created": datetime.fromtimestamp(stats.st_ctime),
                                "is_dir": False
                            })
                        except (PermissionError, FileNotFoundError) as e:
                            logging.warning(f"Could not access file {path}: {e}")
                            continue
                            
        except Exception as e:
            error = str(e)
            logging.error(f"Search error: {e}")
            
        return results, error

    def format_file_size(self, size_bytes: int) -> str:
        """
        Format file size in human-readable format.
        
        Args:
            size_bytes (int): File size in bytes
            
        Returns:
            str: Formatted file size string
        """
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} PB"
