import{j as c}from"./jsx-runtime-D_zvdyIk.js";import{C as w}from"./CourseHeader-CQrwFOvV.js";import"./chevron-left-DN0Odq4E.js";import"./createLucideIcon-DUWlDEBy.js";import"./index-oxIuDU2I.js";import"./_commonjsHelpers-CqkleIqs.js";import"./brain-3icWCldh.js";import"./file-text-flb9FPSV.js";const e={id:1,chaptertitle:"Introduction to Linear Algebra",subtopic:"Vectors and Vector Spaces",topic:"Linear Algebra",knowledge_id:123,chapter:"This is the original chapter content.",chapter_type:"text",context:null,created_at:"2023-01-01T00:00:00Z",k_id:123,level:1,lines:100,metadata:null,needs_code:!1,needs_latex:!0,needs_roleplay:!1,seeded:!0,timestamp_end:600,timestamp_start:0,type:"lecture"},t=[{label:"Notes",key:"notes",iconIdentifier:"FileText"},{label:"Summary",key:"summary",iconIdentifier:"BookOpen"},{label:"Quiz",key:"quiz",iconIdentifier:"PieChart"},{label:"Mindmap",key:"mindmap",iconIdentifier:"Brain"},{label:"Video",key:"video",iconIdentifier:"Video"},{label:"Roleplay",key:"roleplay",iconIdentifier:"MessageSquare"}],z={title:"Course/CourseHeader",component:w,parameters:{layout:"fullscreen"},decorators:[f=>c.jsx("div",{className:"bg-gray-900",children:c.jsx(f,{})})],argTypes:{onShowSettings:{action:"showSettings clicked"},onShowReport:{action:"showReport clicked"},toggleSidebar:{action:"toggleSidebar clicked"},handleTabClick:{action:"tab clicked"},getMissingContentTypes:{description:"Function to get missing content types"}}},o=()=>["quiz","mindmap","video"],a={args:{chapter:e,activeTab:"notes",sidebarOpen:!0,availableTabs:t,showSettingsButton:!0,getMissingContentTypes:o}},s={args:{chapter:e,activeTab:"notes",sidebarOpen:!0,availableTabs:t,showSettingsButton:!1,getMissingContentTypes:()=>[]}},n={args:{chapter:e,activeTab:"quiz",sidebarOpen:!1,availableTabs:t,showSettingsButton:!0,getMissingContentTypes:o}},i={args:{chapter:e,activeTab:"notes",sidebarOpen:!0,availableTabs:t.slice(0,2),showSettingsButton:!0,getMissingContentTypes:o}},r={args:{chapter:e,activeTab:"video",sidebarOpen:!0,availableTabs:t,showSettingsButton:!0,getMissingContentTypes:o}};var p,l,d;a.parameters={...a.parameters,docs:{...(p=a.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    chapter: mockChapter,
    activeTab: 'notes',
    sidebarOpen: true,
    availableTabs: availableTabs,
    showSettingsButton: true,
    getMissingContentTypes: mockGetMissingContentTypes
  }
}`,...(d=(l=a.parameters)==null?void 0:l.docs)==null?void 0:d.source}}};var g,u,m;s.parameters={...s.parameters,docs:{...(g=s.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    chapter: mockChapter,
    activeTab: 'notes',
    sidebarOpen: true,
    availableTabs: availableTabs,
    showSettingsButton: false,
    getMissingContentTypes: () => [] as ContentType[]
  }
}`,...(m=(u=s.parameters)==null?void 0:u.docs)==null?void 0:m.source}}};var b,T,h;n.parameters={...n.parameters,docs:{...(b=n.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    chapter: mockChapter,
    activeTab: 'quiz',
    sidebarOpen: false,
    availableTabs: availableTabs,
    showSettingsButton: true,
    getMissingContentTypes: mockGetMissingContentTypes
  }
}`,...(h=(T=n.parameters)==null?void 0:T.docs)==null?void 0:h.source}}};var y,C,v;i.parameters={...i.parameters,docs:{...(y=i.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    chapter: mockChapter,
    activeTab: 'notes',
    sidebarOpen: true,
    availableTabs: availableTabs.slice(0, 2),
    // Only Notes and Summary tabs
    showSettingsButton: true,
    getMissingContentTypes: mockGetMissingContentTypes
  }
}`,...(v=(C=i.parameters)==null?void 0:C.docs)==null?void 0:v.source}}};var S,k,M;r.parameters={...r.parameters,docs:{...(S=r.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    chapter: mockChapter,
    activeTab: 'video',
    sidebarOpen: true,
    availableTabs: availableTabs,
    showSettingsButton: true,
    getMissingContentTypes: mockGetMissingContentTypes
  }
}`,...(M=(k=r.parameters)==null?void 0:k.docs)==null?void 0:M.source}}};const G=["Default","WithNoMissingContent","WithSidebarClosed","WithLimitedTabs","WithActiveTabVideo"];export{a as Default,r as WithActiveTabVideo,i as WithLimitedTabs,s as WithNoMissingContent,n as WithSidebarClosed,G as __namedExportsOrder,z as default};
//# sourceMappingURL=CourseHeader.stories-BfdZqTRQ.js.map
