import{j as d,I as u}from"./iframe-Baxcka9q.js";import{C as h}from"./CourseContentRenderer-DFEeEg3u.js";import"./LearningReport-SAKc6_Ha.js";import"./createLucideIcon-BhHhnBlm.js";import"./brain-5hf2MatN.js";import"./utils-CbZsw6Wr.js";import"./index-C-cy63yR.js";import"./index-BwObycI8.js";import"./button-DXArZr2y.js";import"./index-Dg-g8a3P.js";import"./x-DqPFOomp.js";import"./loader-circle-8XdIYPpo.js";import"./index-Ci6XSRhi.js";import"./katex-CGuYEXgv.js";import"./chevron-left-CxQQqCjg.js";import"./index-DbLOHU6b.js";import"./input-7Y_YHb2v.js";import"./InteractionTrackerContext-CvBYxA7b.js";import"./trash-2-DHC5cfht.js";import"./circle-question-mark-CgAfY6ym.js";import"./SlopeDrawing-B-4jfn4q.js";import"./GraphCanvas-CfIB4xN4.js";import"./DrawingToolbar-fcU_C2XG.js";const e={id:1,chaptertitle:"Introduction to Linear Algebra",subtopic:"Vectors and Vector Spaces",topic:"Linear Algebra",knowledge_id:123,chapter:"This is the original chapter content. Linear algebra is the branch of mathematics concerning linear equations, linear functions and their representations through matrices and vector spaces.",chapter_type:"text",context:null,created_at:"2023-01-01T00:00:00Z",k_id:123,level:1,lines:100,metadata:null,needs_code:!1,needs_latex:!0,needs_roleplay:!1,seeded:!0,timestamp_end:600,timestamp_start:0,type:"lecture"},a={notes:"These are the notes for the chapter. Linear algebra is a fundamental area of mathematics that deals with vector spaces and linear transformations between these spaces.",summary:"This chapter introduces the fundamental concepts of linear algebra, focusing on vectors, vector spaces, and their operations.",quiz:[{question:"What is a vector space?",options:["A collection of vectors","A mathematical structure that is a set of vectors with operations of addition and scalar multiplication","A three-dimensional coordinate system","A point in a coordinate system"],correct_answer:"A mathematical structure that is a set of vectors with operations of addition and scalar multiplication",answer:"",explanation:"A vector space is a mathematical structure formed by a set of vectors with operations of addition and scalar multiplication, satisfying certain axioms."},{question:"What is linear independence?",options:["When vectors are perpendicular to each other","When no vector in a set can be written as a linear combination of the others","When vectors have the same magnitude","When vectors point in the same direction"],correct_answer:"When no vector in a set can be written as a linear combination of the others",answer:"",explanation:"A set of vectors is linearly independent if no vector in the set can be expressed as a linear combination of the other vectors."}],mindmap:'{"nodes":[{"id":"root","text":"Linear Algebra","fx":400,"fy":200},{"id":"node1","text":"Vector Spaces","fx":200,"fy":100},{"id":"node2","text":"Linear Transformations","fx":600,"fy":100},{"id":"node3","text":"Matrices","fx":200,"fy":300},{"id":"node4","text":"Eigenvalues & Eigenvectors","fx":600,"fy":300}],"links":[{"source":"root","target":"node1"},{"source":"root","target":"node2"},{"source":"root","target":"node3"},{"source":"root","target":"node4"},{"source":"node1","target":"node3"},{"source":"node2","target":"node3"},{"source":"node3","target":"node4"}]}',video_url:"https://example.com/videos/linear-algebra-intro.mp4",roleplay:{scenarios:[{id:"1",title:"Professor and Student Discussion",description:"A conversation between a math professor and a student trying to understand vector spaces.",characters:[{id:"prof",name:"Professor Smith",description:"An experienced mathematics professor specializing in linear algebra."},{id:"student",name:"Alex",description:"A curious student trying to understand the fundamentals of vector spaces."}],initialPrompt:"Alex approaches Professor Smith after class with questions about vector spaces.",relatedCourse:"Linear Algebra"}]},latex_code:"\\begin{align} V = \\{v_1, v_2, \\ldots, v_n\\} \\end{align}"},j={title:"Course/CourseContentRenderer",component:h,parameters:{layout:"fullscreen",backgrounds:{default:"dark"}},decorators:[m=>d.jsx("div",{className:"min-h-screen bg-gray-900",children:d.jsx(u,{children:d.jsx(m,{})})})],argTypes:{onMindmapBack:{action:"mindmap back clicked"},onToggleMindmapFullscreen:{action:"toggle mindmap fullscreen clicked"},onCloseReport:{action:"close report clicked"},onGenerateContentRequest:{action:"generate content requested"}}},t={args:{activeTab:"notes",content:a,chapter:e,language:"English",chaptersMeta:[e],isLoading:!1,showReport:!1,isFullscreenMindmap:!1,sidebarOpen:!0}},n={args:{activeTab:"summary",content:a,chapter:e,language:"English",chaptersMeta:[e],isLoading:!1,showReport:!1,isFullscreenMindmap:!1,sidebarOpen:!0}},r={args:{activeTab:"quiz",content:a,chapter:e,language:"English",chaptersMeta:[e],isLoading:!1,showReport:!1,isFullscreenMindmap:!1,sidebarOpen:!0}},s={args:{activeTab:"mindmap",content:a,chapter:e,language:"English",chaptersMeta:[e],isLoading:!1,showReport:!1,isFullscreenMindmap:!1,sidebarOpen:!0}},o={args:{activeTab:"mindmap",content:a,chapter:e,language:"English",chaptersMeta:[e],isLoading:!1,showReport:!1,isFullscreenMindmap:!0,sidebarOpen:!0}},i={args:{activeTab:"video",content:a,chapter:e,language:"English",chaptersMeta:[e],isLoading:!1,showReport:!1,isFullscreenMindmap:!1,sidebarOpen:!0}},c={args:{activeTab:"roleplay",content:a,chapter:e,language:"English",chaptersMeta:[e],isLoading:!1,showReport:!1,isFullscreenMindmap:!1,sidebarOpen:!0}},p={args:{activeTab:"notes",content:a,chapter:e,language:"English",chaptersMeta:[e],isLoading:!0,showReport:!1,isFullscreenMindmap:!1,sidebarOpen:!0}},l={args:{activeTab:"notes",content:{notes:a.notes},chapter:e,language:"English",chaptersMeta:[e],isLoading:!1,showReport:!1,isFullscreenMindmap:!1,sidebarOpen:!0}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    activeTab: 'notes',
    content: mockContent,
    chapter: mockChapter,
    language: 'English',
    chaptersMeta: [mockChapter],
    isLoading: false,
    showReport: false,
    isFullscreenMindmap: false,
    sidebarOpen: true
  }
}`,...t.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    activeTab: 'summary',
    content: mockContent,
    chapter: mockChapter,
    language: 'English',
    chaptersMeta: [mockChapter],
    isLoading: false,
    showReport: false,
    isFullscreenMindmap: false,
    sidebarOpen: true
  }
}`,...n.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    activeTab: 'quiz',
    content: mockContent,
    chapter: mockChapter,
    language: 'English',
    chaptersMeta: [mockChapter],
    isLoading: false,
    showReport: false,
    isFullscreenMindmap: false,
    sidebarOpen: true
  }
}`,...r.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    activeTab: 'mindmap',
    content: mockContent,
    chapter: mockChapter,
    language: 'English',
    chaptersMeta: [mockChapter],
    isLoading: false,
    showReport: false,
    isFullscreenMindmap: false,
    sidebarOpen: true
  }
}`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    activeTab: 'mindmap',
    content: mockContent,
    chapter: mockChapter,
    language: 'English',
    chaptersMeta: [mockChapter],
    isLoading: false,
    showReport: false,
    isFullscreenMindmap: true,
    sidebarOpen: true
  }
}`,...o.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    activeTab: 'video',
    content: mockContent,
    chapter: mockChapter,
    language: 'English',
    chaptersMeta: [mockChapter],
    isLoading: false,
    showReport: false,
    isFullscreenMindmap: false,
    sidebarOpen: true
  }
}`,...i.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    activeTab: 'roleplay',
    content: mockContent,
    chapter: mockChapter,
    language: 'English',
    chaptersMeta: [mockChapter],
    isLoading: false,
    showReport: false,
    isFullscreenMindmap: false,
    sidebarOpen: true
  }
}`,...c.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    activeTab: 'notes',
    content: mockContent,
    chapter: mockChapter,
    language: 'English',
    chaptersMeta: [mockChapter],
    isLoading: true,
    showReport: false,
    isFullscreenMindmap: false,
    sidebarOpen: true
  }
}`,...p.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    activeTab: 'notes',
    content: {
      // Only including notes content
      notes: mockContent.notes
    },
    chapter: mockChapter,
    language: 'English',
    chaptersMeta: [mockChapter],
    isLoading: false,
    showReport: false,
    isFullscreenMindmap: false,
    sidebarOpen: true
  }
}`,...l.parameters?.docs?.source}}};const P=["NotesTab","SummaryTab","QuizTab","MindmapTab","MindmapFullscreen","VideoTab","RoleplayTab","LoadingState","WithMissingContent"];export{p as LoadingState,o as MindmapFullscreen,s as MindmapTab,t as NotesTab,r as QuizTab,c as RoleplayTab,n as SummaryTab,i as VideoTab,l as WithMissingContent,P as __namedExportsOrder,j as default};
//# sourceMappingURL=CourseContentRenderer.stories-ByPYBkPr.js.map
