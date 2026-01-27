import{j as c}from"./iframe-Baxcka9q.js";import{C as l}from"./CourseHeader-CK8VcCbm.js";import"./chevron-left-CxQQqCjg.js";import"./createLucideIcon-BhHhnBlm.js";import"./brain-5hf2MatN.js";import"./file-text-Bi346tWK.js";const e={id:1,chaptertitle:"Introduction to Linear Algebra",subtopic:"Vectors and Vector Spaces",topic:"Linear Algebra",knowledge_id:123,chapter:"This is the original chapter content.",chapter_type:"text",context:null,created_at:"2023-01-01T00:00:00Z",k_id:123,level:1,lines:100,metadata:null,needs_code:!1,needs_latex:!0,needs_roleplay:!1,seeded:!0,timestamp_end:600,timestamp_start:0,type:"lecture"},t=[{label:"Notes",key:"notes",iconIdentifier:"FileText"},{label:"Summary",key:"summary",iconIdentifier:"BookOpen"},{label:"Quiz",key:"quiz",iconIdentifier:"PieChart"},{label:"Mindmap",key:"mindmap",iconIdentifier:"Brain"},{label:"Video",key:"video",iconIdentifier:"Video"},{label:"Roleplay",key:"roleplay",iconIdentifier:"MessageSquare"}],h={title:"Course/CourseHeader",component:l,parameters:{layout:"fullscreen"},decorators:[p=>c.jsx("div",{className:"bg-gray-900",children:c.jsx(p,{})})],argTypes:{onShowSettings:{action:"showSettings clicked"},onShowReport:{action:"showReport clicked"},toggleSidebar:{action:"toggleSidebar clicked"},handleTabClick:{action:"tab clicked"},getMissingContentTypes:{description:"Function to get missing content types"}}},o=()=>["quiz","mindmap","video"],a={args:{chapter:e,activeTab:"notes",sidebarOpen:!0,availableTabs:t,showSettingsButton:!0,getMissingContentTypes:o}},s={args:{chapter:e,activeTab:"notes",sidebarOpen:!0,availableTabs:t,showSettingsButton:!1,getMissingContentTypes:()=>[]}},n={args:{chapter:e,activeTab:"quiz",sidebarOpen:!1,availableTabs:t,showSettingsButton:!0,getMissingContentTypes:o}},i={args:{chapter:e,activeTab:"notes",sidebarOpen:!0,availableTabs:t.slice(0,2),showSettingsButton:!0,getMissingContentTypes:o}},r={args:{chapter:e,activeTab:"video",sidebarOpen:!0,availableTabs:t,showSettingsButton:!0,getMissingContentTypes:o}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    chapter: mockChapter,
    activeTab: 'notes',
    sidebarOpen: true,
    availableTabs: availableTabs,
    showSettingsButton: true,
    getMissingContentTypes: mockGetMissingContentTypes
  }
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    chapter: mockChapter,
    activeTab: 'notes',
    sidebarOpen: true,
    availableTabs: availableTabs,
    showSettingsButton: false,
    getMissingContentTypes: () => [] as ContentType[]
  }
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    chapter: mockChapter,
    activeTab: 'quiz',
    sidebarOpen: false,
    availableTabs: availableTabs,
    showSettingsButton: true,
    getMissingContentTypes: mockGetMissingContentTypes
  }
}`,...n.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    chapter: mockChapter,
    activeTab: 'notes',
    sidebarOpen: true,
    availableTabs: availableTabs.slice(0, 2),
    // Only Notes and Summary tabs
    showSettingsButton: true,
    getMissingContentTypes: mockGetMissingContentTypes
  }
}`,...i.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    chapter: mockChapter,
    activeTab: 'video',
    sidebarOpen: true,
    availableTabs: availableTabs,
    showSettingsButton: true,
    getMissingContentTypes: mockGetMissingContentTypes
  }
}`,...r.parameters?.docs?.source}}};const y=["Default","WithNoMissingContent","WithSidebarClosed","WithLimitedTabs","WithActiveTabVideo"];export{a as Default,r as WithActiveTabVideo,i as WithLimitedTabs,s as WithNoMissingContent,n as WithSidebarClosed,y as __namedExportsOrder,h as default};
//# sourceMappingURL=CourseHeader.stories-BrMJae9Z.js.map
