# main.py
import sys
from PyQt5.QtWidgets import QApplication
from gui import SearchApp
from PyQt5.QtGui import QStandardItemModel, QStandardItem

app = QApplication(sys.argv)
window = SearchApp()
window.show()

if __name__ == "__main__":
    sys.exit(app.exec_())
