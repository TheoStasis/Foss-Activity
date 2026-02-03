import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, BarElement
} from 'chart.js';
import { Line, Doughnut, Bar, Radar } from 'react-chartjs-2';
import { 
  LayoutDashboard, Upload, FileText, Settings, Bell, Search, Database, 
  Activity, Thermometer, Wind, Clock, Download, Table as TableIcon, History, LogOut, User, Key
} from 'lucide-react';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, BarElement);

// --- AXIOS CONFIGURATION ---
axios.interceptors.request.use(function (config) {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- CSS VARIABLES FOR APPLE-LIKE THEME ---
const appleTheme = `
:root {
  --bg-app: #0a0a0a;
  --bg-sidebar: #1d1d1d;
  --bg-card: #1f1f1f;
  --bg-input: #262626;
  --primary: #0a84ff;
  --accent: #34c759;
  --text-primary: #ffffff;
  --text-secondary: #8e8e93;
  --border: #424245;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 16px 40px rgba(0, 0, 0, 0.6);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: var(--bg-app);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
}

button {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  transition: all 0.2s ease;
}

button:active {
  transform: scale(0.98);
}

input {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

::placeholder {
  color: var(--text-secondary);
}
`;

function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [file, setFile] = useState(null);
  const [currentData, setCurrentData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) fetchHistory();
  }, [token]);

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/stats/');
      setHistory(res.data);
      if (res.data.length > 0 && !currentData) setCurrentData(res.data[0]);
    } catch (err) { 
        if (err.response && err.response.status === 401) logout();
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/stats/', formData);
      setCurrentData(res.data);
      fetchHistory();
      setActiveTab('dashboard');
      setFile(null);
    } catch (err) { alert("Upload failed"); } 
    finally { setLoading(false); }
  };

  const downloadReport = async () => {
    if (!currentData) return;
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/report/${currentData.id}/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Report_${currentData.filename}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { alert("Failed to generate PDF"); }
  };

  if (!token) {
      return <AuthView setToken={setToken} />;
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <DashboardView stats={currentData?.stats} />;
      case 'upload': return <UploadView file={file} setFile={setFile} loading={loading} handleUpload={handleUpload} />;
      case 'datatable': return <DataTableView data={currentData?.stats?.recent_entries} />;
      case 'history': return <HistoryView history={history} load={(item) => { setCurrentData(item); setActiveTab('dashboard'); }} />;
      case 'reports': return <ReportsView data={currentData} download={downloadReport} />;
      default: return <DashboardView stats={currentData?.stats} />;
    }
  };

  return (
    <>
      <style>{appleTheme}</style>
      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <div style={styles.brand}>
            <div style={styles.logo}>◆</div>
            <span style={{fontSize: '16px', fontWeight: '700', letterSpacing: '-0.5px'}}>ChemViz<span style={{color:'var(--primary)'}}>Pro</span></span>
          </div>
          <div style={{marginBottom: '32px'}}>
            <p style={styles.sectionTitle}>OVERVIEW</p>
            <NavItem icon={<LayoutDashboard size={18}/>} label="Dashboard" active={activeTab==='dashboard'} onClick={()=>setActiveTab('dashboard')} />
          </div>
          <div style={{marginBottom: '32px'}}>
            <p style={styles.sectionTitle}>DATA</p>
            <NavItem icon={<Upload size={18}/>} label="Upload" active={activeTab==='upload'} onClick={()=>setActiveTab('upload')} />
            <NavItem icon={<TableIcon size={18}/>} label="Data Table" active={activeTab==='datatable'} onClick={()=>setActiveTab('datatable')} />
          </div>
          <div style={{marginBottom: '32px'}}>
            <p style={styles.sectionTitle}>ANALYSIS</p>
            <NavItem icon={<History size={18}/>} label="History" active={activeTab==='history'} onClick={()=>setActiveTab('history')} />
            <NavItem icon={<FileText size={18}/>} label="Reports" active={activeTab==='reports'} onClick={()=>setActiveTab('reports')} />
          </div>
          <div style={{marginTop:'auto'}}>
            <NavItem icon={<LogOut size={18}/>} label="Logout" onClick={logout} danger />
          </div>
        </aside>
        <main style={styles.main}>
          <header style={styles.header}>
            <div style={styles.breadcrumbs}>
              <span style={{color:'var(--text-secondary)'}}>App /</span> 
              <span style={{marginLeft: '8px', fontWeight: '600'}}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
            </div>
            <div style={styles.headerActions}>
              <div style={styles.datasetBadge}>
                <Database size={14} strokeWidth={2.5}/> 
                <span>{currentData ? currentData.filename : 'No Active Dataset'}</span>
              </div>
              <div style={styles.avatar}>P</div>
            </div>
          </header>
          <div style={styles.content}>{renderContent()}</div>
        </main>
      </div>
    </>
  );
}

// --- AUTH VIEW ---
const AuthView = ({ setToken }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const endpoint = isRegister ? 'register' : 'token';
        try {
            const res = await axios.post(`http://127.0.0.1:8000/api/${endpoint}/`, { username, password });
            if (isRegister) {
                if (res.status === 201 || res.status === 200) {
                    alert("Registration successful! Please login.");
                    setIsRegister(false);
                    setUsername('');
                    setPassword('');
                }
            } else {
                localStorage.setItem('access_token', res.data.access);
                setToken(res.data.access);
            }
        } catch (err) { 
            const errorMsg = err.response?.data?.username?.[0] || err.response?.data?.detail || "Authentication failed. Check credentials.";
            setError(errorMsg);
        }
    };

    return (
        <div style={{height:'100vh', background:'var(--bg-app)', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <div className="card" style={{width:'420px', padding:'48px'}}>
                <div style={{textAlign:'center', marginBottom:'40px'}}>
                   <h1 style={{color:'var(--text-primary)', margin:'0 0 12px 0', fontSize: '32px', fontWeight: '700', letterSpacing: '-1px'}}>ChemViz Pro</h1>
                   <p style={{color:'var(--text-secondary)', fontSize: '14px', margin: 0}}>{isRegister ? 'Create New Account' : 'Secure Login'}</p>
                </div>
                <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                    <div>
                        <label style={{color:'var(--text-secondary)', fontSize:'12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Username</label>
                        <input style={styles.input} placeholder="Min 3 characters" value={username} onChange={e=>setUsername(e.target.value)} required />
                    </div>
                    <div>
                        <label style={{color:'var(--text-secondary)', fontSize:'12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Password</label>
                        <input type="password" style={styles.input} placeholder="Min 6 characters" value={password} onChange={e=>setPassword(e.target.value)} required />
                    </div>
                    {error && <p style={{color:'#ff3b30', fontSize:'13px', margin: '8px 0 0 0'}}>{error}</p>}
                    <button type="submit" style={styles.primaryBtn}>{isRegister ? 'Create Account' : 'Sign In'}</button>
                </form>
                <p style={{textAlign:'center', marginTop:'24px', color:'var(--text-secondary)', fontSize:'13px', cursor:'pointer'}} onClick={()=>{ setIsRegister(!isRegister); setError(''); }}>
                    {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </p>
            </div>
        </div>
    );
};

// --- DASHBOARD VIEW ---
const DashboardView = ({ stats }) => {
  if (!stats) return <EmptyState msg="No data active. Go to Upload." />;
  
  // Line Chart - Pressure Trend
  const lineData = { 
    labels: stats.recent_entries.map((_, i) => `${i + 1}`), 
    datasets: [{ 
      label: 'Pressure (Pa)', 
      data: stats.recent_entries.map(d => d.Pressure), 
      borderColor: 'var(--primary)', 
      backgroundColor: 'rgba(10, 132, 255, 0.05)', 
      fill: true, 
      tension: 0.45,
      borderWidth: 2.5,
      pointRadius: 3,
      pointBackgroundColor: 'var(--primary)',
      pointBorderColor: 'var(--bg-card)',
      pointBorderWidth: 2
    }] 
  };
  
  // Bar Chart - Equipment Count by Type
  const barData = {
    labels: Object.keys(stats.types),
    datasets: [{
      label: 'Equipment Count',
      data: Object.values(stats.types),
      backgroundColor: ['#0a84ff', '#34c759', '#ff9500', '#ff3b30', '#5ac8fa', '#ff2d55', '#af52de', '#a2845e'],
      borderColor: 'var(--border)',
      borderWidth: 2,
      borderRadius: 8,
      hoverBackgroundColor: 'rgba(10, 132, 255, 0.8)'
    }]
  };

  // Pie Chart - Equipment Distribution with Percentages
  const total = Object.values(stats.types).reduce((a, b) => a + b, 0);
  const pieLabels = Object.keys(stats.types).map((label, i) => {
    const percentage = ((Object.values(stats.types)[i] / total) * 100).toFixed(1);
    return `${label} (${percentage}%)`;
  });
  
  const pieData = { 
    labels: pieLabels, 
    datasets: [{ 
      data: Object.values(stats.types), 
      backgroundColor: ['#0a84ff', '#34c759', '#ff9500', '#ff3b30', '#5ac8fa', '#ff2d55', '#af52de', '#a2845e'], 
      borderColor: 'var(--bg-card)',
      borderWidth: 3,
      hoverOffset: 10
    }] 
  };

  // Temperature Distribution - Radar Chart
  const tempData = {
    labels: stats.recent_entries.slice(0, 10).map((_, i) => `Entry ${i + 1}`),
    datasets: [{
      label: 'Temperature (°C)',
      data: stats.recent_entries.slice(0, 10).map(d => d.Temperature || d.Temp || 0),
      borderColor: '#ff9500',
      backgroundColor: 'rgba(255, 149, 0, 0.2)',
      pointBackgroundColor: '#ff9500',
      pointBorderColor: 'var(--bg-card)',
      pointBorderWidth: 2,
      tension: 0.45,
      fill: true
    }]
  };

  return (
    <>
      <div style={styles.grid3}>
        <KpiCard title="Total Rows" value={stats.count} icon="📊" />
        <KpiCard title="Avg Pressure" value={`${stats.avg_pressure.toFixed(1)} Pa`} icon="💨" />
        <KpiCard title="Avg Temp" value={`${stats.avg_temp.toFixed(1)} °C`} icon="🌡️" />
      </div>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px'}}>
        <div className="card" style={{padding: '24px'}}>
          <h3 style={{margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600'}}>Pressure Trend</h3>
          <div style={{height:'280px'}}>
            <Line data={lineData} options={{
              maintainAspectRatio: false, 
              responsive: true,
              plugins: {legend: {display: false, labels: {color: '#ffffff', font: {size: 13, weight: 'bold'}}}},
              scales:{
                x:{display: true, grid:{color:'transparent'}, ticks:{color:'#ffffff', font: {size: 12, weight: 'bold'}}, title: {display: true, text: 'Entry Index', color: '#ffffff'}}, 
                y:{grid:{color:'var(--border)', drawBorder: false}, ticks:{color:'#ffffff', font: {size: 12, weight: 'bold'}}, title: {display: true, text: 'Pressure (Pa)', color: '#ffffff'}}
              }
            }} />
          </div>
        </div>
        <div className="card" style={{padding: '24px'}}>
          <h3 style={{margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600'}}>Equipment by Type</h3>
          <div style={{height:'280px'}}>
            <Bar data={barData} options={{
              maintainAspectRatio: false,
              responsive: true,
              plugins: {legend: {display: true, labels: {color: '#ffffff', font: {size: 13, weight: 'bold'}}}},
              scales:{
                x:{grid:{color:'transparent'}, ticks:{color:'#ffffff', font: {size: 12, weight: 'bold'}}, title: {display: true, text: 'Equipment Type', color: '#ffffff'}}, 
                y:{grid:{color:'var(--border)', drawBorder: false}, ticks:{color:'#ffffff', font: {size: 12, weight: 'bold'}}, title: {display: true, text: 'Count', color: '#ffffff'}}
              }
            }} />
          </div>
        </div>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
        <div className="card" style={{padding: '24px'}}>
          <h3 style={{margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600'}}>Distribution</h3>
          <div style={{height:'280px', display:'flex', justifyContent:'center', alignItems:'center'}}>
            <Doughnut data={pieData} options={{
              maintainAspectRatio: false,
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    color: '#ffffff', 
                    padding: 16, 
                    usePointStyle: true,
                    font: {size: 13, weight: 'bold'}
                  }
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const percentage = ((context.parsed / total) * 100).toFixed(1);
                      return `${context.parsed} units (${percentage}%)`;
                    }
                  }
                }
              }
            }} />
          </div>
        </div>
        <div className="card" style={{padding: '24px'}}>
          <h3 style={{margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600'}}>Temperature Range</h3>
          <div style={{height:'280px'}}>
            <Line data={tempData} options={{
              maintainAspectRatio: false,
              responsive: true,
              plugins: {legend: {display: true, labels: {color: '#ffffff', font: {size: 13, weight: 'bold'}}}},
              scales:{
                x:{display: true, grid:{color:'transparent'}, ticks:{color:'#ffffff', font: {size: 12, weight: 'bold'}}, title: {display: true, text: 'Entry', color: '#ffffff'}}, 
                y:{grid:{color:'var(--border)', drawBorder: false}, ticks:{color:'#ffffff', font: {size: 12, weight: 'bold'}}, title: {display: true, text: 'Temperature (°C)', color: '#ffffff'}}
              }
            }} />
          </div>
        </div>
      </div>
    </>
  );
};

// --- OTHER VIEWS ---
const UploadView = ({ file, setFile, loading, handleUpload }) => (
  <div style={styles.heroCard}>
    <div style={{textAlign:'center', width:'100%'}}>
      <div style={{fontSize: '64px', marginBottom:'20px'}}>📤</div>
      <h2 style={{margin:'0 0 12px 0', fontSize: '26px', fontWeight: '700'}}>Upload Dataset</h2>
      <p style={{color:'var(--text-secondary)', margin: '0 0 32px 0', fontSize: '15px', lineHeight: '1.6'}}>Import a CSV file to analyze chemical equipment data</p>
      <input type="file" id="f" onChange={e => setFile(e.target.files[0])} hidden accept=".csv" />
      <div style={{display:'flex', justifyContent:'center', gap:'12px', flexWrap: 'wrap'}}>
        <label htmlFor="f" style={styles.fileLabel}>{file ? `📎 ${file.name}` : "Select File"}</label>
        <button onClick={handleUpload} style={styles.primaryBtn} disabled={loading}>{loading ? "Processing..." : "Upload"}</button>
      </div>
    </div>
  </div>
);

const DataTableView = ({ data }) => {
  if (!data) return <EmptyState msg="No data available." />;
  return (
    <div className="card" style={{overflow: 'hidden'}}>
      <div style={{padding: '24px', borderBottom: '1px solid var(--border)'}}>
        <h3 style={{margin: 0, fontSize: '18px', fontWeight: '600'}}>Raw Data (Preview)</h3>
      </div>
      <table style={styles.table}>
        <thead>
          <tr style={{textAlign:'left', color:'var(--text-secondary)', fontSize: '13px', fontWeight: '600', borderBottom: '1px solid var(--border)'}}>
            <th style={{padding: '12px 16px'}}>Name</th>
            <th>Type</th>
            <th>Flowrate</th>
            <th>Pressure</th>
            <th>Temp</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((row, i) => (
            <tr key={i} style={{borderTop:'1px solid var(--border)', fontSize: '13px'}}>
              <td style={{padding:'12px 16px'}}>{row['Equipment Name']}</td>
              <td><span style={styles.badge}>{row.Type}</span></td>
              <td>{row.Flowrate}</td>
              <td>{row.Pressure}</td>
              <td>{row.Temperature}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const HistoryView = ({ history, load }) => (
  <div style={{width: '100%'}}>
    <div style={{marginBottom: '20px'}}>
      <h2 style={{fontSize: '20px', fontWeight: '700', margin: '0 0 12px 0'}}>Your Upload History</h2>
      <p style={{color: 'var(--text-secondary)', margin: 0, fontSize: '14px'}}>Access your previous datasets</p>
    </div>
    {history.length === 0 ? (
      <EmptyState msg="No uploads yet. Start by uploading a dataset." />
    ) : (
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'16px'}}>
        {history.map((item, idx) => (
          <div 
            key={item.id || idx} 
            className="card" 
            style={{
              cursor:'pointer', 
              padding: '20px', 
              borderLeft:'4px solid var(--primary)',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={() => load(item)}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
          >
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px'}}>
              <h3 style={{margin: '0', fontSize: '16px', fontWeight: '600', flex: 1}}>{item.filename}</h3>
              <span style={{background: 'rgba(10, 132, 255, 0.1)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600'}}>
                ACTIVE
              </span>
            </div>
            <p style={{color:'var(--text-secondary)', fontSize: '13px', margin: '4px 0'}}>
              📊 {item.stats?.count || 0} records
            </p>
            <p style={{color:'var(--text-secondary)', fontSize: '12px', margin: '4px 0'}}>
              💾 {item.stats?.avg_pressure?.toFixed(1) || 0} Pa avg
            </p>
            <p style={{color:'var(--text-secondary)', fontSize: '12px', margin: '8px 0 0 0'}}>
              🕐 {item.date || 'N/A'}
            </p>
          </div>
        ))}
      </div>
    )}
  </div>
);

const ReportsView = ({ data, download }) => {
  if(!data) return <EmptyState msg="Select a dataset." />;
  return (
    <div className="card" style={{padding: '32px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <h2 style={{margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700'}}>Equipment Summary</h2>
          <p style={{color:'var(--text-secondary)', margin: 0, fontSize: '14px'}}>Generated from {data.filename}</p>
        </div>
        <button onClick={download} style={styles.primaryBtn}><Download size={18} style={{marginRight: '8px'}}/> Download PDF</button>
      </div>
    </div>
  );
};

// --- COMPONENTS ---
const NavItem = ({ icon, label, active, onClick, danger }) => (
  <div onClick={onClick} style={{
    display:'flex', gap:'12px', padding:'10px 12px', borderRadius:'8px', cursor:'pointer', marginBottom:'4px',
    color: active ? 'var(--primary)' : danger ? '#ff3b30' : 'var(--text-secondary)',
    background: active ? 'rgba(10, 132, 255, 0.1)' : danger ? 'transparent' : 'transparent',
    borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
    transition: 'all 0.2s ease'
  }}>
    {icon}
    <span style={{fontSize:'14px', fontWeight: active ? 600 : 500}}>{label}</span>
  </div>
);

const KpiCard = ({ title, value, icon }) => (
  <div className="card" style={{padding:'20px', display:'flex', justifyContent:'space-between', alignItems: 'flex-start'}}>
    <div>
      <p style={{margin:0, color:'var(--text-secondary)', fontSize:'12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px'}}>{title}</p>
      <h2 style={{margin:'8px 0 0 0', fontSize:'28px', fontWeight: '700'}}>{value}</h2>
    </div>
    <div style={{fontSize: '32px'}}>{icon}</div>
  </div>
);

const EmptyState = ({ msg }) => (
  <div style={{height:'400px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'1.5px dashed var(--border)', borderRadius:'12px', color:'var(--text-secondary)'}}>
    <Activity size={48} style={{marginBottom:'20px', opacity:0.5}}/>
    <p style={{fontSize: '15px'}}>{msg}</p>
  </div>
);

const styles = {
  layout: { display: 'flex', height: '100vh', background: 'var(--bg-app)' },
  sidebar: { width: '280px', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)', padding: '24px', display:'flex', flexDirection:'column', overflowY: 'auto' },
  brand: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.4rem', fontWeight: '700', marginBottom: '48px', color:'var(--text-primary)' },
  logo: { width: '36px', height: '36px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color:'#000', fontSize:'18px', fontWeight: '800' },
  sectionTitle: { fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.8px', marginBottom: '12px', textTransform: 'uppercase' },
  main: { flex: 1, display: 'flex', flexDirection: 'column' },
  header: { height: '70px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: 'var(--bg-sidebar)' },
  content: { flex: 1, padding: '32px', overflowY: 'auto' },
  breadcrumbs: { color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center' },
  headerActions: { display: 'flex', gap: '16px', alignItems:'center' },
  datasetBadge: { padding:'8px 12px', background:'var(--bg-app)', border:'1px solid var(--border)', borderRadius:'20px', fontSize:'13px', display:'flex', gap:'8px', alignItems:'center', color:'var(--text-secondary)' },
  avatar: { width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'700', color: '#000' },
  heroCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '60px 40px', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', height:'auto', minHeight: '400px' },
  primaryBtn: { background: 'var(--primary)', color:'#000', border:'none', padding:'10px 20px', borderRadius:'8px', cursor:'pointer', display:'flex', gap:'8px', alignItems:'center', fontWeight:'600', fontSize:'14px', justifyContent:'center' },
  fileLabel: { color: 'var(--text-secondary)', padding: '10px 16px', cursor: 'pointer', border: '1px solid var(--border)', borderRadius:'8px', background: 'var(--bg-input)', transition: 'all 0.2s ease' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' },
  grid2: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  badge: { padding:'4px 10px', borderRadius:'8px', background:'rgba(10, 132, 255, 0.1)', color:'var(--primary)', fontSize:'12px', fontWeight:600 },
  input: { width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', marginTop: '8px', fontSize: '14px', transition: 'all 0.2s ease' }
};

export default App;