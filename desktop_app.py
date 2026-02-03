import sys
import requests
import matplotlib.pyplot as plt
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
from PyQt5.QtWidgets import (QApplication, QWidget, QVBoxLayout, QPushButton, 
                             QLabel, QFileDialog, QMessageBox, QHBoxLayout, QFrame, QLineEdit, QDialog)
from PyQt5.QtCore import Qt

# --- THEME CONFIGURATION ---
THEME = {
    "bg_main": "#0a0e27", "bg_sidebar": "#151b2f", "bg_card": "#1a2847",
    "primary": "#3b82f6", "accent": "#10b981", "text_main": "#ffffff", 
    "text_muted": "#94a3b8", "border": "#2d3a52"
}

STYLESHEET = f"""
QMainWindow {{ background-color: {THEME['bg_main']}; }}
QWidget {{ background-color: {THEME['bg_main']}; color: {THEME['text_main']}; font-family: 'Segoe UI', -apple-system, sans-serif; }}
QFrame#Sidebar {{ background-color: {THEME['bg_sidebar']}; border-right: 1px solid {THEME['border']}; }}
QFrame#Card {{ background-color: {THEME['bg_card']}; border: 1px solid {THEME['border']}; border-radius: 12px; }}
QLabel {{ color: {THEME['text_main']}; background-color: transparent; }}
QLineEdit {{ padding: 12px; border: 1px solid {THEME['border']}; border-radius: 8px; background-color: {THEME['bg_sidebar']}; color: white; selection-background-color: {THEME['primary']}; }}
QPushButton {{ background-color: transparent; color: {THEME['text_muted']}; border: none; padding: 12px 16px; text-align: left; font-size: 14px; border-radius: 8px; }}
QPushButton:hover {{ background-color: rgba(255,255,255,0.05); color: white; }}
QPushButton#ActionBtn {{ background-color: {THEME['primary']}; color: white; border-radius: 8px; font-weight: 600; text-align: center; padding: 12px 24px; }}
QPushButton#ActionBtn:hover {{ background-color: #2563eb; }}
QPushButton#LogoutBtn {{ color: #ef4444; }}
QPushButton#LogoutBtn:hover {{ background-color: rgba(239,68,68,0.1); color: #fca5a5; }}
"""

# --- LOGIN WINDOW ---
class LoginWindow(QDialog):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("ChemViz Pro - Login")
        self.setGeometry(100, 100, 450, 550)
        self.setStyleSheet(STYLESHEET)
        
        layout = QVBoxLayout()
        layout.setContentsMargins(50, 60, 50, 50)
        layout.setSpacing(24)

        title = QLabel("ChemViz Pro")
        title.setStyleSheet(f"font-size: 32px; font-weight: 700; color: {THEME['primary']}; letter-spacing: -0.5px;")
        title.setAlignment(Qt.AlignCenter)
        
        subtitle = QLabel("Chemical Analysis Dashboard")
        subtitle.setStyleSheet(f"font-size: 14px; color: {THEME['text_muted']}; letter-spacing: 0.3px;")
        subtitle.setAlignment(Qt.AlignCenter)
        
        layout.addWidget(title)
        layout.addWidget(subtitle)
        layout.addSpacing(20)

        self.user_input = QLineEdit()
        self.user_input.setPlaceholderText("Username")
        self.user_input.setMinimumHeight(44)
        
        self.pass_input = QLineEdit()
        self.pass_input.setPlaceholderText("Password")
        self.pass_input.setEchoMode(QLineEdit.Password)
        self.pass_input.setMinimumHeight(44)
        
        login_btn = QPushButton("Sign In")
        login_btn.setObjectName("ActionBtn")
        login_btn.setMinimumHeight(44)
        login_btn.clicked.connect(self.do_login)
        
        reg_btn = QPushButton("Create Account")
        reg_btn.setMinimumHeight(44)
        reg_btn.clicked.connect(self.do_register)

        layout.addWidget(self.user_input)
        layout.addWidget(self.pass_input)
        layout.addSpacing(10)
        layout.addWidget(login_btn)
        layout.addWidget(reg_btn)
        layout.addStretch()
        
        self.setLayout(layout)
        self.token = None

    def do_login(self):
        u, p = self.user_input.text(), self.pass_input.text()
        if not u or not p:
            QMessageBox.warning(self, "Error", "Please fill all fields")
            return
        try:
            res = requests.post('http://127.0.0.1:8000/api/token/', json={'username': u, 'password': p})
            if res.status_code == 200:
                self.token = res.json()['access']
                self.accept()
            else: QMessageBox.warning(self, "Error", "Invalid Credentials")
        except: QMessageBox.critical(self, "Error", "Cannot connect to server")

    def do_register(self):
        u, p = self.user_input.text(), self.pass_input.text()
        if not u or not p:
            QMessageBox.warning(self, "Error", "Please fill all fields")
            return
        try:
            res = requests.post('http://127.0.0.1:8000/api/register/', json={'username': u, 'password': p})
            if res.status_code == 201: QMessageBox.information(self, "Success", "Account created! Please login.")
            else: QMessageBox.warning(self, "Error", "Registration failed. Username may exist.")
        except: QMessageBox.critical(self, "Error", "Cannot connect")

# --- MAIN APP ---
class ModernDesktop(QWidget):
    def __init__(self, token):
        super().__init__()
        self.token = token
        self.headers = {'Authorization': f'Bearer {token}'}
        self.current_data = None
        self.initUI()

    def initUI(self):
        self.setWindowTitle('ChemViz Pro Desktop')
        self.setGeometry(100, 100, 1200, 800)
        self.setStyleSheet(STYLESHEET)
        
        root = QHBoxLayout()
        root.setContentsMargins(0, 0, 0, 0)
        root.setSpacing(0)
        
        # --- SIDEBAR ---
        sidebar = QFrame()
        sidebar.setObjectName("Sidebar")
        sidebar.setFixedWidth(240)
        side_layout = QVBoxLayout(sidebar)
        side_layout.setContentsMargins(20, 30, 20, 20)
        side_layout.setSpacing(8)
        
        brand = QLabel("◆ CHEMVIZ PRO")
        brand.setStyleSheet(f"font-size: 18px; font-weight: 700; color: {THEME['primary']}; letter-spacing: 1px;")
        side_layout.addWidget(brand)
        side_layout.addSpacing(30)
        
        # Navigation buttons
        self.dash_btn = QPushButton("📊 Dashboard")
        self.hist_btn = QPushButton("📁 History")
        self.dash_btn.clicked.connect(self.show_dashboard)
        self.hist_btn.clicked.connect(self.show_history)
        
        side_layout.addWidget(self.dash_btn)
        side_layout.addWidget(self.hist_btn)
        side_layout.addStretch()
        
        logout_btn = QPushButton("🚪 Logout")
        logout_btn.setObjectName("LogoutBtn")
        logout_btn.clicked.connect(self.logout)
        side_layout.addWidget(logout_btn)
        
        root.addWidget(sidebar)

        # --- MAIN CONTENT ---
        content = QWidget()
        main_layout = QVBoxLayout(content)
        main_layout.setContentsMargins(40, 30, 40, 30)
        main_layout.setSpacing(24)
        
        header = QHBoxLayout()
        self.header_label = QLabel("Dashboard")
        self.header_label.setStyleSheet(f"font-size: 28px; font-weight: 700; color: {THEME['text_main']};")
        upload_btn = QPushButton("⬆ Upload CSV")
        upload_btn.setObjectName("ActionBtn")
        upload_btn.setFixedWidth(150)
        upload_btn.clicked.connect(self.upload_file)
        header.addWidget(self.header_label)
        header.addStretch()
        header.addWidget(upload_btn)
        main_layout.addLayout(header)

        # --- CONTENT STACK ---
        self.content_widget = QWidget()
        self.content_layout = QVBoxLayout(self.content_widget)
        self.content_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.addWidget(self.content_widget, 1)
        
        root.addWidget(content)
        self.setLayout(root)
        
        # Show landing page initially
        self.show_landing()

    def show_landing(self):
        """Show empty state with centered upload button"""
        self.clear_content()
        self.header_label.setText("Get Started")
        
        landing = QFrame()
        landing.setObjectName("Card")
        landing_layout = QVBoxLayout(landing)
        landing_layout.setAlignment(Qt.AlignCenter)
        landing_layout.setSpacing(20)
        
        icon = QLabel("📤")
        icon.setAlignment(Qt.AlignCenter)
        icon.setStyleSheet(f"font-size: 72px;")
        
        title = QLabel("Upload Your Dataset")
        title.setAlignment(Qt.AlignCenter)
        title.setStyleSheet(f"font-size: 24px; font-weight: 700; color: {THEME['text_main']};")
        
        desc = QLabel("Import a CSV file to analyze chemical equipment data\nand generate comprehensive reports.")
        desc.setAlignment(Qt.AlignCenter)
        desc.setStyleSheet(f"font-size: 14px; color: {THEME['text_muted']}; line-height: 1.6;")
        
        upload_btn = QPushButton("Select CSV File")
        upload_btn.setObjectName("ActionBtn")
        upload_btn.setFixedWidth(200)
        upload_btn.setFixedHeight(44)
        upload_btn.clicked.connect(self.upload_file)
        
        # Create container for button to center it
        btn_container = QHBoxLayout()
        btn_container.addStretch()
        btn_container.addWidget(upload_btn)
        btn_container.addStretch()
        
        landing_layout.addWidget(icon)
        landing_layout.addWidget(title)
        landing_layout.addWidget(desc)
        landing_layout.addSpacing(20)
        landing_layout.addLayout(btn_container)
        
        self.content_layout.addWidget(landing, 1)

    def show_dashboard(self):
        """Show dashboard with data"""
        if not self.current_data:
            self.show_landing()
            return
        
        self.clear_content()
        self.header_label.setText("Dashboard")
        
        stats = self.current_data.get('stats', {})
        
        # KPI Cards
        kpi_layout = QHBoxLayout()
        kpi_layout.setSpacing(20)
        self.kpi_count = self.create_kpi("Total Records", str(stats.get('count', 0)), "📊")
        self.kpi_press = self.create_kpi("Avg Pressure", f"{stats.get('avg_pressure', 0):.1f} Pa", "💨")
        self.kpi_temp = self.create_kpi("Avg Temp", f"{stats.get('avg_temp', 0):.1f} °C", "🌡️")
        kpi_layout.addWidget(self.kpi_count)
        kpi_layout.addWidget(self.kpi_press)
        kpi_layout.addWidget(self.kpi_temp)
        self.content_layout.addLayout(kpi_layout)
        
        # Charts
        charts_layout = QHBoxLayout()
        charts_layout.setSpacing(20)
        
        self.chart_frame = QFrame()
        self.chart_frame.setObjectName("Card")
        chart_layout = QVBoxLayout(self.chart_frame)
        self.fig, self.ax = plt.subplots(facecolor=THEME['bg_card'])
        self.canvas = FigureCanvas(self.fig)
        chart_layout.addWidget(self.canvas)
        
        self.pie_frame = QFrame()
        self.pie_frame.setObjectName("Card")
        pie_layout = QVBoxLayout(self.pie_frame)
        self.fig_pie, self.ax_pie = plt.subplots(facecolor=THEME['bg_card'])
        self.canvas_pie = FigureCanvas(self.fig_pie)
        pie_layout.addWidget(self.canvas_pie)
        
        charts_layout.addWidget(self.chart_frame, 2)
        charts_layout.addWidget(self.pie_frame, 1)
        self.content_layout.addLayout(charts_layout, 1)
        
        self.update_charts(stats)

    def show_history(self):
        """Show upload history"""
        self.clear_content()
        self.header_label.setText("History")
        
        msg = QLabel("📋 History feature coming soon")
        msg.setStyleSheet(f"color: {THEME['text_muted']}; font-size: 16px;")
        msg.setAlignment(Qt.AlignCenter)
        self.content_layout.addWidget(msg, 1)

    def clear_content(self):
        """Clear content layout"""
        while self.content_layout.count():
            child = self.content_layout.takeAt(0)
            if child.widget():
                child.widget().deleteLater()

    def create_kpi(self, title, value, emoji):
        """Create KPI card"""
        card = QFrame()
        card.setObjectName("Card")
        card.setFixedHeight(120)
        layout = QVBoxLayout(card)
        layout.setContentsMargins(20, 16, 20, 16)
        layout.setSpacing(8)
        
        emoji_label = QLabel(emoji)
        emoji_label.setStyleSheet("font-size: 32px;")
        emoji_label.setAlignment(Qt.AlignCenter)
        
        title_label = QLabel(title)
        title_label.setStyleSheet(f"color: {THEME['text_muted']}; font-size: 12px; font-weight: 700; text-transform: uppercase;")
        title_label.setAlignment(Qt.AlignCenter)
        
        value_label = QLabel(value)
        value_label.setStyleSheet(f"color: {THEME['text_main']}; font-size: 26px; font-weight: 700;")
        value_label.setAlignment(Qt.AlignCenter)
        value_label.setObjectName("val_lbl")
        
        layout.addWidget(emoji_label)
        layout.addWidget(title_label)
        layout.addWidget(value_label)
        
        return card

    def upload_file(self):
        """Handle file upload"""
        fname, _ = QFileDialog.getOpenFileName(self, 'Select CSV File', '.', "CSV Files (*.csv)")
        if fname:
            try:
                with open(fname, 'rb') as f:
                    files = {'file': f}
                    res = requests.post('http://127.0.0.1:8000/api/stats/', files=files, headers=self.headers)
                
                if res.status_code == 200:
                    self.current_data = res.json()
                    self.show_dashboard()
                    QMessageBox.information(self, "Success", "File uploaded successfully!")
                else:
                    QMessageBox.warning(self, "Error", "Upload failed. Check file format.")
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Error: {str(e)}")

    def update_charts(self, stats):
        """Update chart visualizations"""
        recent = stats.get('recent_entries', [])
        
        self.ax.clear()
        self.ax.set_facecolor(THEME['bg_card'])
        if recent:
            pressures = [d.get('Pressure', 0) for d in recent]
            self.ax.plot(pressures, color=THEME['primary'], linewidth=2.5, marker='o', markersize=4)
            self.ax.fill_between(range(len(pressures)), pressures, alpha=0.2, color=THEME['primary'])
        self.ax.set_title("Pressure Trend", color=THEME['text_main'], fontsize=14, fontweight='bold', pad=15)
        self.ax.set_xlabel("Index", color=THEME['text_main'], fontsize=10)
        self.ax.set_ylabel("Pressure (Pa)", color=THEME['text_main'], fontsize=10)
        self.ax.tick_params(colors=THEME['text_main'], labelsize=10)
        self.ax.xaxis.label.set_color(THEME['text_main'])
        self.ax.yaxis.label.set_color(THEME['text_main'])
        for spine in self.ax.spines.values():
            spine.set_edgecolor(THEME['border'])
            spine.set_color(THEME['border'])
        self.canvas.draw()

        self.ax_pie.clear()
        types = stats.get('types', {})
        if types:
            colors = [THEME['primary'], THEME['accent'], '#f59e0b', '#ef4444']
            self.ax_pie.pie(types.values(), labels=types.keys(), autopct='%1.1f%%', 
                          colors=colors[:len(types)], textprops={'color': THEME['text_main'], 'fontsize': 10}, startangle=90)
            self.ax_pie.set_title("Equipment Types", color=THEME['text_main'], fontsize=14, fontweight='bold', pad=15)
        for text in self.ax_pie.texts:
            text.set_color(THEME['text_main'])
            text.set_fontsize(10)
        self.canvas_pie.draw()

    def logout(self):
        """Logout and exit"""
        reply = QMessageBox.question(self, "Logout", "Are you sure you want to logout?", 
                                    QMessageBox.Yes | QMessageBox.No)
        if reply == QMessageBox.Yes:
            self.close()

if __name__ == '__main__':
    app = QApplication(sys.argv)
    login = LoginWindow()
    if login.exec_() == QDialog.Accepted:
        ex = ModernDesktop(login.token)
        ex.show()
        sys.exit(app.exec_())