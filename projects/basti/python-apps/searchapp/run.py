import sys
import os

# Add the virtual environment site-packages to the Python path
venv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'venv', 'Lib', 'site-packages')
sys.path.insert(0, venv_path)

# Now import and run the main application
from main import app
sys.exit(app.exec_()) 