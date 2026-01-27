import{j as t,r as c}from"./iframe-Baxcka9q.js";import{unifiedApiService as a}from"./unified-api-service-DcwecCUO.js";import"./dynamic-api-client-DsM8pL3o.js";const y=()=>{const[b,v]=c.useState(!1),[p,m]=c.useState(0),[r,k]=c.useState(null),[i,u]=c.useState(!1),[s,h]=c.useState([{id:"upload",title:"Upload Knowledge File",description:"Upload educational content files to create a knowledge base",status:"pending"},{id:"verify",title:"Verify Upload",description:"Confirm files were uploaded and knowledge entry was created",status:"pending"},{id:"process",title:"Start Processing",description:"Begin AI processing to extract content and generate structure",status:"pending"},{id:"monitor",title:"Monitor Processing",description:"Track processing status and wait for completion",status:"pending"},{id:"generate",title:"Generate Content",description:"Create educational materials (notes, summaries, quizzes)",status:"pending"},{id:"retrieve",title:"Retrieve Chapters",description:"Get processed chapter data and generated content",status:"pending"},{id:"analytics",title:"View Analytics",description:"Check content generation analytics and metrics",status:"pending"},{id:"graph",title:"Knowledge Graph",description:"Sync to knowledge graph and view relationships",status:"pending"}]);c.useEffect(()=>{(async()=>{try{await a.initialize("http://localhost:8000"),v(!0)}catch(n){console.error("Failed to initialize API service:",n)}})()},[]);const f=(e,n)=>{h(l=>l.map((o,d)=>d===e?{...o,...n}:o))},x=async e=>{const n=s[e],l=Date.now();f(e,{status:"running"});try{let o;switch(n.id){case"upload":o=await C(),o?.knowledge_id&&k(o.knowledge_id);break;case"verify":if(!r)throw new Error("No knowledge ID available");o=await a.getKnowledgeFiles(r);break;case"process":if(!r)throw new Error("No knowledge ID available");o=await a.startProcessing(r,{generateContent:!0,contentTypes:["notes","summary","quiz"],contentLanguage:"English"});break;case"monitor":if(!r)throw new Error("No knowledge ID available");o=await j(r);break;case"generate":if(!r)throw new Error("No knowledge ID available");o=await a.generateContent(r,{types:["notes","summary","quiz"],language:"English"});break;case"retrieve":if(!r)throw new Error("No knowledge ID available");o=await a.getChapterData(r,{language:"English"});break;case"analytics":if(!r)throw new Error("No knowledge ID available");o=await a.getContentAnalytics(r);break;case"graph":if(!r)throw new Error("No knowledge ID available");await a.syncKnowledgeGraph(r),o=await a.getKnowledgeGraph(r);break;default:throw new Error(`Unknown step: ${n.id}`)}const d=Date.now()-l;return f(e,{status:"completed",result:o,duration:d,error:void 0}),o}catch(o){const d=Date.now()-l;throw f(e,{status:"error",error:o.message,duration:d}),o}},C=async()=>{const e=`
# Advanced Mathematics Course

## Course Overview
This comprehensive course covers advanced mathematical concepts for undergraduate students.

## Chapter 1: Calculus Fundamentals

### 1.1 Limits and Continuity
Understanding the concept of limits is crucial for calculus. A limit describes the behavior of a function as it approaches a particular point.

**Key Concepts:**
- Definition of a limit
- One-sided limits
- Infinite limits
- Continuity at a point

**Example Problem:**
Find the limit of f(x) = (x² - 4)/(x - 2) as x approaches 2.

**Solution:**
Using algebraic manipulation:
f(x) = (x² - 4)/(x - 2) = (x + 2)(x - 2)/(x - 2) = x + 2

Therefore, lim(x→2) f(x) = 2 + 2 = 4

### 1.2 Derivatives
The derivative represents the rate of change of a function at any given point.

**Applications:**
- Finding slopes of tangent lines
- Optimization problems
- Related rates
- Motion analysis

## Chapter 2: Integration Techniques

### 2.1 Basic Integration
Integration is the reverse process of differentiation.

**Fundamental Rules:**
- Power rule: ∫x^n dx = x^(n+1)/(n+1) + C
- Sum rule: ∫[f(x) + g(x)]dx = ∫f(x)dx + ∫g(x)dx
- Constant multiple: ∫k·f(x)dx = k·∫f(x)dx

### 2.2 Advanced Techniques
- Integration by parts
- Substitution method
- Partial fractions
- Trigonometric substitution

## Chapter 3: Differential Equations

### 3.1 First-Order Equations
Solving equations involving derivatives and their applications.

**Types:**
- Separable equations
- Linear equations
- Exact equations
- Bernoulli equations

**Real-world Applications:**
- Population growth models
- Radioactive decay
- Newton's cooling law
- Economic models

## Learning Objectives

By completing this course, students will:
1. Master fundamental calculus concepts
2. Apply integration techniques to solve complex problems
3. Understand and solve differential equations
4. Analyze mathematical models of real-world phenomena
5. Develop problem-solving strategies for advanced mathematics

## Assessment Methods
- Weekly problem sets (30%)
- Midterm examination (25%)
- Final examination (35%)
- Class participation (10%)

## Prerequisites
- College Algebra
- Trigonometry
- Pre-Calculus

This course provides the foundation for advanced mathematics and engineering studies.
    `.trim(),n=new File([e],"advanced-mathematics-course.md",{type:"text/markdown"});return await a.uploadKnowledgeFiles([n],"Storybook Demo - Advanced Mathematics Course")},j=async e=>{const n=[];for(let l=0;l<3;l++){await new Promise(d=>setTimeout(d,1e3));const o=await a.getProcessingStatus(e);n.push(o)}return{checks:n,final_status:n[n.length-1]}},S=async()=>{if(!i){u(!0),m(0),h(e=>e.map(n=>({...n,status:"pending",result:void 0,error:void 0,duration:void 0})));try{for(let e=0;e<s.length;e++)m(e),await x(e),e<s.length-1&&await new Promise(n=>setTimeout(n,500))}catch(e){console.error("Workflow failed:",e)}finally{u(!1)}}},I=async e=>{if(!i){u(!0);try{await x(e)}finally{u(!1)}}},z=e=>{switch(e.status){case"running":return"⏳";case"completed":return"✅";case"error":return"❌";default:return"⚪"}},w=e=>{switch(e.status){case"running":return"#fbbf24";case"completed":return"#10b981";case"error":return"#ef4444";default:return"#6b7280"}};return b?t.jsxs("div",{style:{padding:"20px",maxWidth:"900px",margin:"0 auto"},children:[t.jsxs("div",{style:{marginBottom:"24px"},children:[t.jsx("h1",{style:{color:"#1f2937",marginBottom:"8px"},children:"📚 Knowledge Management Workflow"}),t.jsx("p",{style:{color:"#6b7280",marginBottom:"16px"},children:"Complete end-to-end demonstration of the knowledge processing pipeline"}),t.jsxs("div",{style:{display:"flex",gap:"12px",marginBottom:"20px"},children:[t.jsx("button",{onClick:S,disabled:i,style:{padding:"12px 24px",backgroundColor:i?"#9ca3af":"#3b82f6",color:"white",border:"none",borderRadius:"6px",cursor:i?"not-allowed":"pointer",fontWeight:"bold"},children:i?"🔄 Running Workflow...":"🚀 Run Complete Workflow"}),r&&t.jsxs("div",{style:{padding:"12px 16px",backgroundColor:"#ecfdf5",borderRadius:"6px",border:"1px solid #d1fae5"},children:[t.jsx("strong",{style:{color:"#065f46"},children:"Knowledge ID:"}),t.jsxs("span",{style:{color:"#047857",fontFamily:"monospace"},children:[" ",r]})]})]})]}),t.jsx("div",{style:{display:"grid",gap:"16px"},children:s.map((e,n)=>t.jsxs("div",{style:{border:`2px solid ${n===p&&i?"#3b82f6":"#e5e7eb"}`,borderRadius:"8px",padding:"16px",backgroundColor:n===p&&i?"#eff6ff":"#ffffff",transition:"all 0.3s ease"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"},children:[t.jsxs("h3",{style:{margin:0,color:"#1f2937"},children:[z(e)," ",e.title]}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[e.duration&&t.jsxs("span",{style:{fontSize:"12px",color:"#6b7280"},children:[e.duration,"ms"]}),t.jsx("button",{onClick:()=>I(n),disabled:i,style:{padding:"6px 12px",fontSize:"12px",backgroundColor:i?"#9ca3af":"#f3f4f6",color:i?"white":"#374151",border:"1px solid #d1d5db",borderRadius:"4px",cursor:i?"not-allowed":"pointer"},children:"Run Step"})]})]}),t.jsx("p",{style:{color:"#6b7280",margin:"0 0 12px 0",fontSize:"14px"},children:e.description}),e.status!=="pending"&&t.jsxs("div",{style:{padding:"12px",backgroundColor:"#f9fafb",border:`1px solid ${w(e)}`,borderRadius:"4px"},children:[t.jsx("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:e.error||e.result?"8px":"0"},children:t.jsx("span",{style:{color:w(e),fontWeight:"bold"},children:e.status.toUpperCase()})}),e.error&&t.jsxs("div",{style:{color:"#ef4444",fontSize:"14px",marginBottom:"8px",padding:"8px",backgroundColor:"#fef2f2",borderRadius:"4px"},children:[t.jsx("strong",{children:"Error:"})," ",e.error]}),e.result&&t.jsxs("details",{style:{fontSize:"12px"},children:[t.jsx("summary",{style:{cursor:"pointer",color:"#6b7280",marginBottom:"8px"},children:"View Step Results"}),t.jsx("pre",{style:{backgroundColor:"#f3f4f6",padding:"8px",borderRadius:"4px",overflow:"auto",maxHeight:"150px",fontSize:"11px"},children:JSON.stringify(e.result,null,2)})]})]})]},e.id))}),t.jsxs("div",{style:{marginTop:"32px",padding:"16px",backgroundColor:"#f0f9ff",borderRadius:"8px",border:"1px solid #bae6fd"},children:[t.jsx("h3",{style:{margin:"0 0 8px 0",color:"#0c4a6e"},children:"📋 Workflow Overview"}),t.jsxs("div",{style:{fontSize:"14px",color:"#0c4a6e"},children:[t.jsxs("p",{children:[t.jsx("strong",{children:"Total Steps:"})," ",s.length]}),t.jsxs("p",{children:[t.jsx("strong",{children:"Completed:"})," ",s.filter(e=>e.status==="completed").length]}),t.jsxs("p",{children:[t.jsx("strong",{children:"Failed:"})," ",s.filter(e=>e.status==="error").length]}),t.jsxs("p",{children:[t.jsx("strong",{children:"Current Step:"})," ",p+1," - ",s[p]?.title]})]})]})]}):t.jsxs("div",{style:{padding:"20px",textAlign:"center"},children:[t.jsx("h2",{children:"🚀 Initializing Knowledge Management System..."}),t.jsx("p",{children:"Connecting to backend services..."})]})},D={title:"API Integration/Knowledge Workflow",component:y,parameters:{docs:{description:{component:`
# Knowledge Management Workflow Demo

This story demonstrates the complete knowledge management pipeline from file upload 
to content generation and analytics. Each step is executed in sequence with real API calls.

## Workflow Steps:

1. **Upload**: Create knowledge entry with educational content
2. **Verify**: Confirm upload success and file metadata
3. **Process**: Start AI processing pipeline
4. **Monitor**: Track processing status over time
5. **Generate**: Create educational materials (notes, summaries, quizzes)
6. **Retrieve**: Get processed chapter data
7. **Analytics**: View content generation metrics
8. **Graph**: Sync to knowledge graph database

## Features:
- Step-by-step execution with visual progress
- Individual step testing capability
- Real-time status updates and error handling
- Complete result inspection for each step
- Knowledge ID tracking across workflow

Perfect for demonstrating the full capabilities of the knowledge management system.
        `}}}},g={name:"📚 Complete Knowledge Workflow",render:()=>t.jsx(y,{})};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: '📚 Complete Knowledge Workflow',
  render: () => <KnowledgeWorkflowDemo />
}`,...g.parameters?.docs?.source}}};const W=["CompleteWorkflow"];export{g as CompleteWorkflow,W as __namedExportsOrder,D as default};
//# sourceMappingURL=KnowledgeWorkflow.stories-gmMCQVfJ.js.map
