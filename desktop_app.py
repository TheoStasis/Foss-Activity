import sys
import requests
import matplotlib.pyplot as plt
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
from PyQt5.QtWidgets import (QApplication, QWidget, QVBoxLayout, QPushButton, 
                             QLabel, QFileDialog, QMessageBox, QHBoxLayout, QFrame)
from PyQt5.QtCore import Qt

# --- THEME CONFIGURATION ---
THEME = {
    "bg_main": "#0f172a",       # Deep Blue
    "bg_sidebar": "#1e293b",    # Slate
    "bg_card": "#1e293b",       # Card BG
    "primary": "#3b82f6",       # Blue Accent
    "text_main": "#ffffff",     # Pure White (Forced)
    "text_muted": "#cbd5e1",    # Light Gray
    "border": "#334155"         # Border Color
}

# --- CSS STYLESHEET (High Contrast) ---
STYLESHEET = f"""
QMainWindow {{ background-color: {THEME['bg_main']}; }}
QWidget {{ 
    background-color: {THEME['bg_main']}; 
    color: {THEME['text_main']}; 
    font-family: 'Segoe UI', sans-serif; 
}}

/* SIDEBAR & CARDS - Force Backgrounds */
QFrame#Sidebar, QFrame#Card {{ 
    background-color: {THEME['bg_card']}; 
    border: 1px solid {THEME['border']}; 
    border-radius: 8px;
}}

/* LABELS - Force White Text */
QLabel {{
    color: {THEME['text_main']};
    background-color: transparent; /* Fix for labels inheriting weird bg */
}}
QLabel#KpiTitle {{ 
    color: {THEME['text_muted']}; 
    font-size: 11px; 
    font-weight: 700; 
    text-transform: uppercase; 
}}
QLabel#KpiValue {{ 
    color: {THEME['text_main']}; 
    font-size: 24px; 
    font-weight: bold; 
}}

/* BUTTONS */
QPushButton {{
    background-color: {THEME['bg_sidebar']};
    color: {THEME['text_muted']};
    border: none;
    padding: 10px;
    text-align: left;
    font-size: 13px;
}}
QPushButton:hover {{
    background-color: #334155;
    color: white;
}}
QPushButton#ActionBtn {{
    background-color: {THEME['primary']}; 
    color: white; 
    border-radius: 6px; 
    font-weight: 600;
    text-align: center;
}}
QPushButton#ActionBtn:hover {{ background-color: #2563eb; }}
"""

class ModernDesktop(QWidget):
    def __init__(self):
        super().__init__()
        self.initUI()

    def initUI(self):
        self.setWindowTitle('ChemViz Pro Desktop')
        self.setGeometry(100, 100, 1000, 700)
        self.setStyleSheet(STYLESHEET)
        
        # ROOT LAYOUT
        root_layout = QHBoxLayout()
        root_layout.setContentsMargins(0, 0, 0, 0)
        root_layout.setSpacing(0)

        # --- 1. SIDEBAR ---
        sidebar = QFrame()
        sidebar.setObjectName("Sidebar")
        sidebar.setFixedWidth(200)
        side_layout = QVBoxLayout(sidebar)
        side_layout.setContentsMargins(0, 30, 0, 20)
        side_layout.setSpacing(5)

        # Brand
        brand = QLabel("  CHEMVIZ PRO")
        brand.setStyleSheet(f"font-size: 16px; font-weight: 900; color: {THEME['primary']}; letter-spacing: 1px; margin-bottom: 20px;")
        side_layout.addWidget(brand)

        # Nav Buttons
        btn_dash = QPushButton("  Dashboard")
        btn_dash.setStyleSheet(f"color: {THEME['primary']}; font-weight: bold; border-left: 3px solid {THEME['primary']}; background-color: rgba(59, 130, 246, 0.1);")
        
        btn_data = QPushButton("  History")
        btn_sets = QPushButton("  Settings")

        side_layout.addWidget(btn_dash)
        side_layout.addWidget(btn_data)
        side_layout.addStretch()
        side_layout.addWidget(btn_sets)
        
        root_layout.addWidget(sidebar)

        # --- 2. MAIN CONTENT ---
        content_area = QWidget()
        main_layout = QVBoxLayout(content_area)
        main_layout.setContentsMargins(30, 30, 30, 30)
        main_layout.setSpacing(20)

        # Header
        header_layout = QHBoxLayout()
        page_title = QLabel("Dashboard Overview")
        page_title.setStyleSheet("font-size: 22px; font-weight: bold;")
        
        self.upload_btn = QPushButton("Upload New CSV")
        self.upload_btn.setObjectName("ActionBtn")
        self.upload_btn.setCursor(Qt.PointingHandCursor)
        self.upload_btn.setFixedWidth(140)
        self.upload_btn.clicked.connect(self.upload_file)

        header_layout.addWidget(page_title)
        header_layout.addStretch()
        header_layout.addWidget(self.upload_btn)
        main_layout.addLayout(header_layout)

        # KPI Row
        kpi_layout = QHBoxLayout()
        kpi_layout.setSpacing(15)
        self.kpi_count = self.create_kpi("Total Records", "0")
        self.kpi_press = self.create_kpi("Avg Pressure", "0 Pa")
        self.kpi_temp = self.create_kpi("Avg Temp", "0 °C")
        
        kpi_layout.addWidget(self.kpi_count)
        kpi_layout.addWidget(self.kpi_press)
        kpi_layout.addWidget(self.kpi_temp)
        main_layout.addLayout(kpi_layout)

        # Charts Area
        charts_layout = QHBoxLayout()
        charts_layout.setSpacing(15)
        
        # Left: Bar Chart
        self.chart_frame = QFrame()
        self.chart_frame.setObjectName("Card")
        self.chart_layout = QVBoxLayout(self.chart_frame)
        
        # Chart 1 Setup (Fixing White Background)
        self.fig, self.ax = plt.subplots(facecolor=THEME['bg_card'])
        self.canvas = FigureCanvas(self.fig)
        self.canvas.setStyleSheet(f"background-color: {THEME['bg_card']}; border-radius: 8px;")
        self.chart_layout.addWidget(self.canvas)
        
        # Right: Pie Chart
        self.pie_frame = QFrame()
        self.pie_frame.setObjectName("Card")
        self.pie_layout = QVBoxLayout(self.pie_frame)
        
        # Chart 2 Setup (Fixing White Background)
        self.fig_pie, self.ax_pie = plt.subplots(facecolor=THEME['bg_card'])
        self.canvas_pie = FigureCanvas(self.fig_pie)
        self.canvas_pie.setStyleSheet(f"background-color: {THEME['bg_card']}; border-radius: 8px;")
        self.pie_layout.addWidget(self.canvas_pie)

        charts_layout.addWidget(self.chart_frame, 60) # 60% width
        charts_layout.addWidget(self.pie_frame, 40)   # 40% width
        
        main_layout.addLayout(charts_layout, 1)

        root_layout.addWidget(content_area)
        self.setLayout(root_layout)

    def create_kpi(self, title, value):
        frame = QFrame()
        frame.setObjectName("Card")
        frame.setFixedHeight(100)
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(20, 15, 20, 15)
        
        t = QLabel(title)
        t.setObjectName("KpiTitle")
        v = QLabel(value)
        v.setObjectName("KpiValue")
        
        layout.addWidget(t)
        layout.addWidget(v)
        return frame

    def upload_file(self):
        fname, _ = QFileDialog.getOpenFileName(self, 'Open CSV', '.', "CSV (*.csv)")
        if fname:
            try:
                files = {'file': open(fname, 'rb')}
                res = requests.post('http://127.0.0.1:8000/api/stats/', files=files)
                if res.status_code == 200:
                    data = res.json()
                    # Handle both old/new backend response structures
                    stats = data.get('stats', data) if 'stats' in data else data
                    self.update_ui(stats)
                else:
                    QMessageBox.warning(self, "Error", "Server returned error. Check Backend.")
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Could not connect to backend.\n{str(e)}")

    def update_ui(self, data):
        # Update KPIs
        self.kpi_count.findChild(QLabel, "KpiValue").setText(str(data.get('count', 0)))
        self.kpi_press.findChild(QLabel, "KpiValue").setText(f"{data.get('avg_pressure', 0):.1f} Pa")
        self.kpi_temp.findChild(QLabel, "KpiValue").setText(f"{data.get('avg_temp', 0):.1f} °C")

        # --- UPDATE BAR CHART (DARK MODE FIX) ---
        self.ax.clear()
        self.ax.set_facecolor(THEME['bg_card']) # Force inner plot dark
        bars = self.ax.bar(['Pressure', 'Temp'], 
                           [data.get('avg_pressure', 0), data.get('avg_temp', 0)], 
                           color=['#3b82f6', '#10b981'])
        
        self.ax.set_title("Average Metrics", color='white', pad=10)
        self.ax.tick_params(axis='x', colors='#cbd5e1')
        self.ax.tick_params(axis='y', colors='#cbd5e1')
        for spine in self.ax.spines.values(): 
            spine.set_edgecolor('#334155')
        
        self.canvas.draw()

        # --- UPDATE PIE CHART (DARK MODE FIX) ---
        self.ax_pie.clear()
        types = data.get('types', {})
        if types:
            wedges, texts, autotexts = self.ax_pie.pie(
                types.values(), 
                labels=types.keys(), 
                autopct='%1.1f%%',
                colors=['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                textprops={'color': 'white'}
            )
            self.ax_pie.set_title("Equipment Distribution", color='white', pad=10)
        else:
            self.ax_pie.text(0.5, 0.5, "No Data", color='white', ha='center')
            
        self.canvas_pie.draw()

if __name__ == '__main__':
    app = QApplication(sys.argv)
    ex = ModernDesktop()
    ex.show()
    sys.exit(app.exec_())