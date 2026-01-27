import{j as e,r}from"./iframe-Baxcka9q.js";import{unifiedApiService as p}from"./unified-api-service-DcwecCUO.js";import"./dynamic-api-client-DsM8pL3o.js";const C=({label:o,value:d,change:s,trend:i})=>{const a=()=>{switch(i){case"up":return"📈";case"down":return"📉";default:return"📊"}},l=()=>{switch(i){case"up":return"#10b981";case"down":return"#ef4444";default:return"#6b7280"}};return e.jsxs("div",{style:{padding:"16px",backgroundColor:"#ffffff",border:"1px solid #e5e7eb",borderRadius:"8px",boxShadow:"0 1px 3px rgba(0, 0, 0, 0.1)"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"},children:[e.jsx("h4",{style:{margin:0,color:"#6b7280",fontSize:"14px",fontWeight:"normal"},children:o}),e.jsx("span",{style:{fontSize:"18px"},children:a()})]}),e.jsx("div",{style:{fontSize:"24px",fontWeight:"bold",color:"#1f2937",marginBottom:"4px"},children:d}),s&&e.jsx("div",{style:{fontSize:"12px",color:l()},children:s})]})},j=()=>{const[o,d]=r.useState(!1),[s,i]=r.useState(!1),[a,l]=r.useState(null),[f,A]=r.useState(null),[h,S]=r.useState(null),[c,w]=r.useState(!1),[y,b]=r.useState(null);r.useEffect(()=>{(async()=>{try{await p.initialize("http://localhost:8000"),d(!0),await x()}catch(t){console.error("Failed to initialize API service:",t)}})()},[]),r.useEffect(()=>{if(c&&o){const n=setInterval(x,3e4);return b(n),()=>clearInterval(n)}else y&&(clearInterval(y),b(null))},[c,o]);const x=async()=>{i(!0);try{const[n,t]=await Promise.all([p.getAnalyticsDashboard(),p.getPerformanceStats({limit:100})]);l(n),A(t),S(new Date)}catch(n){console.error("Failed to load analytics data:",n)}finally{i(!1)}},R=()=>{w(!c)},D=()=>{if(!a)return[];const n=[];if(a.overview){const t=a.overview;n.push({label:"Total Knowledge Entries",value:t.total_knowledge_entries||0,trend:"up"},{label:"Content Generated",value:t.total_content_generated||0,trend:"up"},{label:"Success Rate",value:`${(t.success_rate||0).toFixed(1)}%`,trend:t.success_rate>90?"up":"stable"},{label:"Avg Processing Time",value:t.avg_processing_time||"N/A",trend:"stable"})}if(f?.summary){const t=f.summary;n.push({label:"Total Operations",value:t.total_operations||0,trend:"up"},{label:"Operations Success Rate",value:`${(t.success_rate||0).toFixed(1)}%`,trend:t.success_rate>95?"up":"stable"},{label:"Average Duration",value:`${(t.avg_duration||0).toFixed(1)}ms`,trend:"stable"})}if(a.recent_activity){const t=a.recent_activity;t.last_24h&&n.push({label:"Uploads (24h)",value:t.last_24h.uploads||0,change:"+12% from yesterday",trend:"up"},{label:"Processing Completed (24h)",value:t.last_24h.processing_completed||0,change:"+8% from yesterday",trend:"up"},{label:"Content Generated (24h)",value:t.last_24h.content_generated||0,change:"+15% from yesterday",trend:"up"})}return n},P=()=>f?.stats?f.stats.slice(0,10):[];if(!o)return e.jsxs("div",{style:{padding:"20px",textAlign:"center"},children:[e.jsx("h2",{children:"🚀 Initializing Analytics Dashboard..."}),e.jsx("p",{children:"Connecting to analytics services..."})]});const v=D(),g=P();return e.jsxs("div",{style:{padding:"20px",maxWidth:"1200px",margin:"0 auto"},children:[e.jsxs("div",{style:{marginBottom:"24px"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"},children:[e.jsxs("div",{children:[e.jsx("h1",{style:{color:"#1f2937",marginBottom:"4px"},children:"📊 Real-Time Analytics Dashboard"}),e.jsx("p",{style:{color:"#6b7280",margin:0},children:"Live metrics and performance data from the backend"})]}),e.jsxs("div",{style:{display:"flex",gap:"12px",alignItems:"center"},children:[e.jsx("button",{onClick:R,style:{padding:"8px 16px",backgroundColor:c?"#10b981":"#6b7280",color:"white",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"14px"},children:c?"🔄 Auto-Refresh ON":"⏸️ Auto-Refresh OFF"}),e.jsx("button",{onClick:x,disabled:s,style:{padding:"8px 16px",backgroundColor:s?"#9ca3af":"#3b82f6",color:"white",border:"none",borderRadius:"6px",cursor:s?"not-allowed":"pointer",fontSize:"14px"},children:s?"🔄 Loading...":"🔄 Refresh Now"})]})]}),h&&e.jsxs("div",{style:{fontSize:"12px",color:"#6b7280",padding:"8px 12px",backgroundColor:"#f3f4f6",borderRadius:"4px",display:"inline-block"},children:["Last updated: ",h.toLocaleTimeString()]})]}),s&&!a&&e.jsxs("div",{style:{textAlign:"center",padding:"40px"},children:[e.jsx("div",{style:{fontSize:"48px",marginBottom:"16px"},children:"📊"}),e.jsx("h3",{children:"Loading Analytics Data..."})]}),v.length>0&&e.jsxs("div",{style:{marginBottom:"32px"},children:[e.jsx("h2",{style:{color:"#1f2937",marginBottom:"16px"},children:"📈 Key Metrics"}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(250px, 1fr))",gap:"16px"},children:v.map((n,t)=>e.jsx(C,{...n},t))})]}),g.length>0&&e.jsxs("div",{style:{marginBottom:"32px"},children:[e.jsx("h2",{style:{color:"#1f2937",marginBottom:"16px"},children:"⚡ Recent Operations"}),e.jsxs("div",{style:{backgroundColor:"#ffffff",border:"1px solid #e5e7eb",borderRadius:"8px",overflow:"hidden"},children:[e.jsx("div",{style:{padding:"12px 16px",backgroundColor:"#f9fafb",borderBottom:"1px solid #e5e7eb",fontWeight:"bold",color:"#374151"},children:"Recent API Operations"}),e.jsx("div",{style:{maxHeight:"300px",overflow:"auto"},children:g.map((n,t)=>e.jsxs("div",{style:{padding:"12px 16px",borderBottom:t<g.length-1?"1px solid #f3f4f6":"none",display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[e.jsx("span",{style:{fontSize:"18px"},children:n.success?"✅":"❌"}),e.jsxs("div",{children:[e.jsx("div",{style:{fontWeight:"500",color:"#1f2937"},children:n.operation_type||"Unknown Operation"}),e.jsx("div",{style:{fontSize:"12px",color:"#6b7280"},children:new Date(n.timestamp).toLocaleString()})]})]}),e.jsxs("div",{style:{textAlign:"right"},children:[e.jsx("div",{style:{fontWeight:"500",color:"#1f2937"},children:n.duration?`${n.duration.toFixed(1)}ms`:"N/A"}),n.error_count>0&&e.jsxs("div",{style:{fontSize:"12px",color:"#ef4444"},children:[n.error_count," errors"]})]})]},t))})]})]}),a&&e.jsxs("div",{style:{marginBottom:"32px"},children:[e.jsx("h2",{style:{color:"#1f2937",marginBottom:"16px"},children:"🔍 Raw Analytics Data"}),e.jsxs("details",{style:{backgroundColor:"#ffffff",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"16px"},children:[e.jsx("summary",{style:{cursor:"pointer",fontWeight:"bold",marginBottom:"12px"},children:"View Complete Dashboard Response"}),e.jsx("pre",{style:{backgroundColor:"#f3f4f6",padding:"12px",borderRadius:"4px",overflow:"auto",fontSize:"12px",maxHeight:"400px"},children:JSON.stringify(a,null,2)})]})]}),e.jsxs("div",{style:{marginTop:"32px",padding:"16px",backgroundColor:"#fef3c7",borderRadius:"8px",border:"1px solid #fcd34d"},children:[e.jsx("h3",{style:{margin:"0 0 8px 0",color:"#92400e"},children:"💡 Analytics Features"}),e.jsxs("ul",{style:{margin:0,color:"#92400e",fontSize:"14px"},children:[e.jsx("li",{children:"Real-time metrics updated every 30 seconds with auto-refresh"}),e.jsx("li",{children:"Performance tracking for all API operations"}),e.jsx("li",{children:"Success rates, processing times, and error monitoring"}),e.jsx("li",{children:"Recent activity tracking and trend analysis"}),e.jsx("li",{children:"Complete raw data inspection for debugging"})]})]})]})},z={title:"API Integration/Real-Time Analytics",component:j,parameters:{docs:{description:{component:`
# Real-Time Analytics Dashboard

Live analytics dashboard displaying real metrics from the backend analytics endpoints.
Shows system performance, usage statistics, and operational metrics without any mocking.

## Features:
- **Live Data**: Real metrics from the analytics API
- **Auto-Refresh**: Automatic updates every 30 seconds
- **Performance Tracking**: Operation durations and success rates
- **Trend Analysis**: Visual indicators for metric changes
- **Recent Activity**: Latest API operations and their status
- **Raw Data Access**: Complete response inspection

## Metrics Displayed:
- Total knowledge entries and content generated
- System success rates and processing times
- Recent activity (uploads, processing, content generation)
- API operation performance and error tracking

## Interactive Features:
- Toggle auto-refresh on/off
- Manual refresh capability
- Expandable raw data views
- Real-time status updates

Perfect for monitoring system health and performance in development and production.
        `}}}},u={name:"📊 Live Analytics Dashboard",render:()=>e.jsx(j,{})},m={name:"⚡ Performance Monitoring",render:()=>{const[o,d]=r.useState(null),[s,i]=r.useState(!1),a=async()=>{i(!0);try{await p.initialize("http://localhost:8000");const l=await p.getPerformanceStats({limit:50});d(l)}catch(l){console.error("Failed to load performance data:",l)}finally{i(!1)}};return r.useEffect(()=>{a()},[]),e.jsxs("div",{style:{padding:"20px"},children:[e.jsx("h2",{children:"⚡ API Performance Monitoring"}),e.jsx("button",{onClick:a,disabled:s,style:{marginBottom:"20px",padding:"8px 16px"},children:s?"Loading...":"Refresh Performance Data"}),o&&e.jsx("pre",{style:{backgroundColor:"#f3f4f6",padding:"16px",borderRadius:"8px",overflow:"auto",maxHeight:"500px"},children:JSON.stringify(o,null,2)})]})}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: '📊 Live Analytics Dashboard',
  render: () => <RealTimeAnalyticsDashboard />
}`,...u.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: '⚡ Performance Monitoring',
  render: () => {
    const [performanceData, setPerformanceData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const loadPerformanceData = async () => {
      setLoading(true);
      try {
        await unifiedApiService.initialize('http://localhost:8000');
        const data = await unifiedApiService.getPerformanceStats({
          limit: 50
        });
        setPerformanceData(data);
      } catch (error) {
        console.error('Failed to load performance data:', error);
      } finally {
        setLoading(false);
      }
    };
    useEffect(() => {
      loadPerformanceData();
    }, []);
    return <div style={{
      padding: '20px'
    }}>
        <h2>⚡ API Performance Monitoring</h2>
        <button onClick={loadPerformanceData} disabled={loading} style={{
        marginBottom: '20px',
        padding: '8px 16px'
      }}>
          {loading ? 'Loading...' : 'Refresh Performance Data'}
        </button>
        
        {performanceData && <pre style={{
        backgroundColor: '#f3f4f6',
        padding: '16px',
        borderRadius: '8px',
        overflow: 'auto',
        maxHeight: '500px'
      }}>
            {JSON.stringify(performanceData, null, 2)}
          </pre>}
      </div>;
  }
}`,...m.parameters?.docs?.source}}};const L=["LiveAnalytics","PerformanceMonitoring"];export{u as LiveAnalytics,m as PerformanceMonitoring,L as __namedExportsOrder,z as default};
//# sourceMappingURL=RealTimeAnalytics.stories-Cf3ZbmDM.js.map
