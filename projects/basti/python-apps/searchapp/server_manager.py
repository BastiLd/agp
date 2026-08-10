import os
import socket
from typing import Optional, Tuple
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pyftpdlib.authorizers import DummyAuthorizer
from pyftpdlib.handlers import FTPHandler
from pyftpdlib.servers import FTPServer
from threading import Thread
from PyQt5.QtCore import QObject, pyqtSignal

class CustomHTTPHandler(SimpleHTTPRequestHandler):
    """Angepasster HTTP-Handler mit Authentifizierung"""
    
    def __init__(self, *args, username=None, password=None, **kwargs):
        self.username = username
        self.password = password
        super().__init__(*args, **kwargs)
        
    def do_AUTHHEAD(self):
        self.send_response(401)
        self.send_header('WWW-Authenticate', 'Basic realm="Login Required"')
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        
    def do_GET(self):
        if self.username and self.password:
            # Prüfe Authentifizierung
            if self.headers.get('Authorization') is None:
                self.do_AUTHHEAD()
                return
                
            import base64
            auth = self.headers.get('Authorization')
            auth = auth.split(' ')[1]
            auth = base64.b64decode(auth).decode('utf-8')
            user, pwd = auth.split(':')
            
            if user != self.username or pwd != self.password:
                self.do_AUTHHEAD()
                return
                
        return super().do_GET()

class ServerManager(QObject):
    """Verwaltet HTTP- und FTP-Server"""
    
    status_changed = pyqtSignal(str, bool)  # Signal für Statusänderungen (server_type, is_running)
    
    def __init__(self):
        super().__init__()
        self.http_server: Optional[HTTPServer] = None
        self.ftp_server: Optional[FTPServer] = None
        self.http_thread: Optional[Thread] = None
        self.ftp_thread: Optional[Thread] = None
        
    def start_http_server(self, port: int = 80, username: str = None, 
                         password: str = None, directory: str = None) -> Tuple[bool, str]:
        """Startet den HTTP-Server"""
        if self.http_server:
            return False, "HTTP-Server läuft bereits"
            
        try:
            if directory:
                os.chdir(directory)
                
            handler = lambda *args, **kwargs: CustomHTTPHandler(*args, 
                                                              username=username,
                                                              password=password,
                                                              **kwargs)
            
            self.http_server = HTTPServer(('', port), handler)
            self.http_thread = Thread(target=self.http_server.serve_forever)
            self.http_thread.daemon = True
            self.http_thread.start()
            
            self.status_changed.emit('http', True)
            return True, f"HTTP-Server gestartet auf Port {port}"
            
        except Exception as e:
            return False, f"Fehler beim Starten des HTTP-Servers: {e}"
            
    def stop_http_server(self) -> Tuple[bool, str]:
        """Stoppt den HTTP-Server"""
        if not self.http_server:
            return False, "HTTP-Server läuft nicht"
            
        try:
            self.http_server.shutdown()
            self.http_server.server_close()
            self.http_server = None
            self.http_thread = None
            
            self.status_changed.emit('http', False)
            return True, "HTTP-Server gestoppt"
            
        except Exception as e:
            return False, f"Fehler beim Stoppen des HTTP-Servers: {e}"
            
    def start_ftp_server(self, port: int = 21, username: str = None,
                        password: str = None, directory: str = None) -> Tuple[bool, str]:
        """Startet den FTP-Server"""
        if self.ftp_server:
            return False, "FTP-Server läuft bereits"
            
        try:
            authorizer = DummyAuthorizer()
            
            if username and password:
                if directory:
                    authorizer.add_user(username, password, directory, perm="elradfmw")
                else:
                    authorizer.add_user(username, password, os.getcwd(), perm="elradfmw")
            else:
                if directory:
                    authorizer.add_anonymous(directory)
                else:
                    authorizer.add_anonymous(os.getcwd())
                    
            handler = FTPHandler
            handler.authorizer = authorizer
            
            self.ftp_server = FTPServer(('', port), handler)
            self.ftp_thread = Thread(target=self.ftp_server.serve_forever)
            self.ftp_thread.daemon = True
            self.ftp_thread.start()
            
            self.status_changed.emit('ftp', True)
            return True, f"FTP-Server gestartet auf Port {port}"
            
        except Exception as e:
            return False, f"Fehler beim Starten des FTP-Servers: {e}"
            
    def stop_ftp_server(self) -> Tuple[bool, str]:
        """Stoppt den FTP-Server"""
        if not self.ftp_server:
            return False, "FTP-Server läuft nicht"
            
        try:
            self.ftp_server.close_all()
            self.ftp_server = None
            self.ftp_thread = None
            
            self.status_changed.emit('ftp', False)
            return True, "FTP-Server gestoppt"
            
        except Exception as e:
            return False, f"Fehler beim Stoppen des FTP-Servers: {e}"
            
    def is_port_available(self, port: int) -> bool:
        """Prüft ob ein Port verfügbar ist"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.bind(('', port))
            sock.close()
            return True
        except:
            return False 