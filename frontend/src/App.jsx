import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { 
  LayoutDashboard, Upload, FileText, Settings, Bell, Search, Database, 
  Activity, Thermometer, Wind, Clock, Download, Table as TableIcon, History
} from 'lucide-react';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // Control which page is shown
  const [file, setFile] = useState(null);
  const [currentData, setCurrentData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load history on startup
  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/stats/');
      setHistory(res.data);
      // Auto-load most recent if available
      if (res.data.length > 0 && !currentData) setCurrentData(res.data[0]);
    } catch (err) { console.error("API error"); }
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
      setActiveTab('dashboard'); // Redirect to dashboard after upload
    } catch (err) { alert("Upload failed"); } 
    finally { setLoading(false); }
  };

  const downloadReport = async () => {
    if (!currentData) return alert("No dataset selected");
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/report/${currentData.id}/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Report_${currentData.filename}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { alert("Failed to generate PDF."); }
  };

  // --- RENDER HELPERS ---
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
    <div style={styles.layout}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.logo}>CE</div><span>ChemViz<span style={{color:'var(--primary)'}}>.Pro</span></span>
        </div>
        
        <div style={{marginBottom: '30px'}}>
          <p style={styles.sectionTitle}>OVERVIEW</p>
          <NavItem icon={<LayoutDashboard size={18}/>} label="Dashboard" active={activeTab==='dashboard'} onClick={()=>setActiveTab('dashboard')} />
        </div>

        <div style={{marginBottom: '30px'}}>
          <p style={styles.sectionTitle}>DATA MANAGEMENT</p>
          <NavItem icon={<Upload size={18}/>} label="Upload" active={activeTab==='upload'} onClick={()=>setActiveTab('upload')} />
          <NavItem icon={<TableIcon size={18}/>} label="Data Table" active={activeTab==='datatable'} onClick={()=>setActiveTab('datatable')} />
        </div>

        <div style={{marginBottom: '30px'}}>
          <p style={styles.sectionTitle}>ANALYSIS</p>
          <NavItem icon={<History size={18}/>} label="History" active={activeTab==='history'} onClick={()=>setActiveTab('history')} />
          <NavItem icon={<FileText size={18}/>} label="Reports" active={activeTab==='reports'} onClick={()=>setActiveTab('reports')} />
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={styles.main}>
        {/* HEADER */}
        <header style={styles.header}>
          <div style={styles.breadcrumbs}>
             <span style={{color:'var(--text-muted)'}}>App /</span> {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </div>
          <div style={styles.headerActions}>
            <div style={styles.datasetBadge}>
               <Database size={14}/> {currentData ? currentData.filename : 'No Active Dataset'}
            </div>
            <div style={styles.avatar}>T</div>
          </div>
        </header>

        {/* DYNAMIC CONTENT */}
        <div style={styles.content}>
           {renderContent()}
        </div>
      </main>
    </div>
  );
}

// --- SUB-VIEWS (PAGES) ---

const DashboardView = ({ stats }) => {
  if (!stats) return <EmptyState msg="No data active. Go to Upload." />;
  
  const lineData = {
    labels: stats.recent_entries.map((_, i) => `Reading ${i + 1}`),
    datasets: [{ label: 'Pressure', data: stats.recent_entries.map(d => d.Pressure), borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension:0.4 }]
  };
  const pieData = {
    labels: Object.keys(stats.types),
    datasets: [{ data: Object.values(stats.types), backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'], borderWidth: 0 }]
  };

  return (
    <>
      <div style={styles.grid3}>
        <KpiCard title="Total Rows" value={stats.count} icon={<Database color="#3b82f6"/>} />
        <KpiCard title="Avg Pressure" value={`${stats.avg_pressure.toFixed(1)} Pa`} icon={<Wind color="#10b981"/>} />
        <KpiCard title="Avg Temp" value={`${stats.avg_temp.toFixed(1)} °C`} icon={<Thermometer color="#f59e0b"/>} />
      </div>
      <div style={styles.grid2}>
        <div className="card" style={{gridColumn: 'span 2'}}>
            <div style={styles.cardHeader}><h3>Pressure Trend</h3></div>
            <div style={{height:'250px'}}><Line data={lineData} options={{maintainAspectRatio: false, scales:{x:{display:false}, y:{grid:{color:'#334155'}}}}} /></div>
        </div>
        <div className="card">
            <div style={styles.cardHeader}><h3>Equipment Types</h3></div>
            <div style={{height:'200px', display:'flex', justifyContent:'center'}}><Doughnut data={pieData} /></div>
        </div>
      </div>
    </>
  );
};

const UploadView = ({ file, setFile, loading, handleUpload }) => (
  <div style={styles.heroCard}>
      <div style={{textAlign:'center', width:'100%'}}>
        <Upload size={48} color="var(--primary)" style={{marginBottom:'20px'}}/>
        <h2 style={{margin:'0 0 10px 0'}}>Upload CSV Dataset</h2>
        <p style={{color:'var(--text-muted)', marginBottom:'20px'}}>Supported formats: .csv (Max 10MB)</p>
        
        <input type="file" id="f" onChange={e => setFile(e.target.files[0])} hidden />
        <div style={{display:'flex', justifyContent:'center', gap:'10px'}}>
           <label htmlFor="f" style={styles.fileLabel}>{file ? file.name : "Select File"}</label>
           <button onClick={handleUpload} style={styles.primaryBtn} disabled={loading}>
             {loading ? "Processing..." : "Upload & Analyze"}
           </button>
        </div>
      </div>
  </div>
);

const DataTableView = ({ data }) => {
  if (!data) return <EmptyState msg="No data available." />;
  return (
    <div className="card">
       <div style={styles.cardHeader}><h3>Raw Data (Preview)</h3></div>
       <table style={styles.table}>
         <thead>
           <tr style={{textAlign:'left', color:'var(--text-muted)'}}><th>Name</th><th>Type</th><th>Flowrate</th><th>Pressure</th><th>Temp</th></tr>
         </thead>
         <tbody>
           {data.map((row, i) => (
             <tr key={i} style={{borderTop:'1px solid var(--border)'}}>
               <td style={{padding:'12px'}}>{row['Equipment Name']}</td>
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
  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'20px'}}>
    {history.map(item => (
      <div key={item.id} className="card" style={{cursor:'pointer', borderLeft:'4px solid var(--primary)'}} onClick={() => load(item)}>
         <div style={{display:'flex', justifyContent:'space-between'}}>
            <h3>{item.filename}</h3>
            <span style={{fontSize:'12px', color:'var(--text-muted)'}}>{item.date}</span>
         </div>
         <p style={{color:'var(--text-muted)'}}>ID: {item.id} • Records: {item.stats.count}</p>
         <button style={styles.secondaryBtn}>Load Dataset</button>
      </div>
    ))}
  </div>
);

const ReportsView = ({ data, download }) => {
   if(!data) return <EmptyState msg="Select a dataset to generate reports." />;
   return (
     <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
           <div>
              <h2>Equipment Summary Report</h2>
              <p style={{color:'var(--text-muted)'}}>Generated from {data.filename}</p>
           </div>
           <button onClick={download} style={styles.primaryBtn}><Download size={18}/> Download PDF</button>
        </div>
        <div style={{padding:'20px', background:'rgba(59,130,246,0.1)', borderRadius:'8px', border:'1px solid var(--primary)'}}>
           <h4 style={{margin:'0 0 10px 0', color:'var(--primary)'}}>Report Ready</h4>
           <p style={{margin:0, fontSize:'14px'}}>Your report is ready for download. It includes statistical summaries and equipment breakdown.</p>
        </div>
     </div>
   );
}

// --- COMPONENTS ---
const NavItem = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} style={{
    display:'flex', gap:'12px', padding:'12px', borderRadius:'8px', cursor:'pointer', marginBottom:'5px',
    color: active?'#fff':'#94a3b8', background: active?'rgba(59,130,246,0.1)':'transparent', borderLeft: active?'3px solid var(--primary)':'3px solid transparent'
  }}>
    {icon} <span style={{fontSize:'0.9rem', fontWeight: active?600:400}}>{label}</span>
  </div>
);

const KpiCard = ({ title, value, icon }) => (
  <div className="card" style={{display:'flex', justifyContent:'space-between'}}>
    <div><p style={{margin:0, color:'#94a3b8', fontSize:'0.85rem'}}>{title}</p><h2 style={{margin:'5px 0', fontSize:'1.8rem'}}>{value}</h2></div>
    <div style={{padding:'8px', background:'rgba(255,255,255,0.05)', borderRadius:'8px'}}>{icon}</div>
  </div>
);

const EmptyState = ({ msg }) => (
  <div style={{height:'400px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'2px dashed var(--border)', borderRadius:'12px', color:'var(--text-muted)'}}>
     <Activity size={48} style={{marginBottom:'20px', opacity:0.5}}/>
     <p>{msg}</p>
  </div>
);

// --- STYLES ---
const styles = {
  layout: { display: 'flex', height: '100vh', background: 'var(--bg-app)' },
  sidebar: { width: '260px', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)', padding: '24px', display:'flex', flexDirection:'column' },
  brand: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '40px', color:'#fff' },
  logo: { width: '36px', height: '36px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color:'#fff', fontSize:'14px' },
  sectionTitle: { fontSize: '0.7rem', color: '#64748b', fontWeight: '700', letterSpacing: '0.1em', marginBottom: '15px' },
  
  main: { flex: 1, display: 'flex', flexDirection: 'column' },
  header: { height: '70px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: 'var(--bg-sidebar)' },
  content: { flex: 1, padding: '32px', overflowY: 'auto' },
  
  breadcrumbs: { color: '#f8fafc', fontSize: '14px', fontWeight: 500 },
  headerActions: { display: 'flex', gap: '20px', alignItems:'center' },
  datasetBadge: { padding:'6px 12px', background:'var(--bg-app)', border:'1px solid var(--border)', borderRadius:'20px', fontSize:'12px', display:'flex', gap:'8px', alignItems:'center', color:'var(--text-muted)' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'bold' },

  heroCard: { background: 'var(--bg-sidebar)', border: '1px solid var(--border)', padding: '40px', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', height:'300px' },
  primaryBtn: { background: 'var(--primary)', color:'#fff', border:'none', padding:'10px 24px', borderRadius:'6px', cursor:'pointer', display:'flex', gap:'8px', alignItems:'center', fontWeight:'600', fontSize:'14px' },
  secondaryBtn: { background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize:'12px', marginTop:'10px' },
  fileLabel: { color: '#94a3b8', padding: '10px 20px', cursor: 'pointer', border: '1px dashed #475569', borderRadius:'6px' },

  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' },
  grid2: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' },
  cardHeader: { marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  badge: { padding:'4px 8px', borderRadius:'12px', background:'rgba(59,130,246,0.1)', color:'var(--primary)', fontSize:'12px', fontWeight:600 }
};

export default App;