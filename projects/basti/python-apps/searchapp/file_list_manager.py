import os
from datetime import datetime
from typing import List, Dict
from PyQt5.QtCore import QObject, pyqtSignal
from PyQt5.QtWidgets import QFileDialog, QMessageBox

class FileList:
    def __init__(self, name: str, paths: List[str], watch_changes: bool = False):
        self.name = name
        self.paths = paths
        self.watch_changes = watch_changes
        self.last_modified = datetime.now()

class FileListManager(QObject):
    """Verwaltet Dateilisten für die Suche"""
    
    list_changed = pyqtSignal()  # Signal wenn sich Listen ändern
    
    def __init__(self):
        super().__init__()
        self.file_lists: Dict[str, FileList] = {}
        
    def add_list(self, name: str, paths: List[str], watch_changes: bool = False) -> bool:
        """Fügt eine neue Dateiliste hinzu"""
        if name in self.file_lists:
            return False
            
        self.file_lists[name] = FileList(name, paths, watch_changes)
        self.list_changed.emit()
        return True
        
    def remove_list(self, name: str) -> bool:
        """Entfernt eine Dateiliste"""
        if name not in self.file_lists:
            return False
            
        del self.file_lists[name]
        self.list_changed.emit()
        return True
        
    def get_list(self, name: str) -> FileList:
        """Gibt eine Dateiliste zurück"""
        return self.file_lists.get(name)
        
    def get_all_lists(self) -> List[FileList]:
        """Gibt alle Dateilisten zurück"""
        return list(self.file_lists.values())
        
    def update_list(self, name: str, paths: List[str], watch_changes: bool = None) -> bool:
        """Aktualisiert eine bestehende Dateiliste"""
        if name not in self.file_lists:
            return False
            
        file_list = self.file_lists[name]
        file_list.paths = paths
        if watch_changes is not None:
            file_list.watch_changes = watch_changes
        file_list.last_modified = datetime.now()
        
        self.list_changed.emit()
        return True
        
    def import_list(self, file_path: str) -> bool:
        """Importiert eine Dateiliste aus einer Datei"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                name = os.path.splitext(os.path.basename(file_path))[0]
                paths = [line.strip() for line in f if line.strip()]
                return self.add_list(name, paths)
        except Exception as e:
            print(f"Fehler beim Importieren der Liste: {e}")
            return False
            
    def export_list(self, name: str, file_path: str) -> bool:
        """Exportiert eine Dateiliste in eine Datei"""
        file_list = self.get_list(name)
        if not file_list:
            return False
            
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                for path in file_list.paths:
                    f.write(f"{path}\n")
            return True
        except Exception as e:
            print(f"Fehler beim Exportieren der Liste: {e}")
            return False
            
    def merge_lists(self, list_names: List[str], new_name: str) -> bool:
        """Führt mehrere Dateilisten zu einer neuen zusammen"""
        all_paths = []
        for name in list_names:
            file_list = self.get_list(name)
            if file_list:
                all_paths.extend(file_list.paths)
                
        if not all_paths:
            return False
            
        # Entferne Duplikate und sortiere
        all_paths = sorted(set(all_paths))
        return self.add_list(new_name, all_paths) 