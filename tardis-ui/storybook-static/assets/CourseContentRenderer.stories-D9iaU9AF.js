import{j as d}from"./jsx-runtime-D_zvdyIk.js";import{C as I}from"./CourseContentRenderer-Bds7_HMi.js";import{I as N}from"./InteractionTrackerContextMock-CA1BdasH.js";import"./index-oxIuDU2I.js";import"./_commonjsHelpers-CqkleIqs.js";import"./LearningReport-DzsWHkdl.js";import"./createLucideIcon-DUWlDEBy.js";import"./brain-3icWCldh.js";import"./utils-Ba4dZznC.js";import"./index-0JNj-DyH.js";import"./index-ChhEEol8.js";import"./tiny-invariant-CopsF_GD.js";import"./button-eFm21kA6.js";import"./index-BABKXdJD.js";import"./x-DCH7TPgH.js";import"./loader-circle-qNWLSv1Y.js";import"./index-CQhbAgzH.js";import"./katex-QVvjep9m.js";import"./chevron-left-DN0Odq4E.js";import"./index-BckpPEFY.js";import"./input-BW5vinc8.js";import"./InteractionTrackerContext-CoH6j3_1.js";import"./trash-2-JYNVpPlF.js";import"./circle-question-mark-Dj2ml970.js";import"./SlopeDrawing-Dgc_oX9g.js";import"./GraphCanvas-BCuXRoXj.js";import"./DrawingToolbar-Bna5UYmO.js";const e={id:1,chaptertitle:"Introduction to Linear Algebra",subtopic:"Vectors and Vector Spaces",topic:"Linear Algebra",knowledge_id:123,chapter:"This is the original chapter content. Linear algebra is the branch of mathematics concerning linear equations, linear functions and their representations through matrices and vector spaces.",chapter_type:"text",context:null,created_at:"2023-01-01T00:00:00Z",k_id:123,level:1,lines:100,metadata:null,needs_code:!1,needs_latex:!0,needs_roleplay:!1,seeded:!0,timestamp_end:600,timestamp_start:0,type:"lecture"},a={notes:"These are the notes for the chapter. Linear algebra is a fundamental area of mathematics that deals with vector spaces and linear transformations between these spaces.",summary:"This chapter introduces the fundamental concepts of linear algebra, focusing on vectors, vector spaces, and their operations.",quiz:[{question:"What is a vector space?",options:["A collection of vectors","A mathematical structure that is a set of vectors with operations of addition and scalar multiplication","A three-dimensional coordinate system","A point in a coordinate system"],correct_answer:"A mathematical structure that is a set of vectors with operations of addition and scalar multiplication",answer:"",explanation:"A vector space is a mathematical structure formed by a set of vectors with operations of addition and scalar multiplication, satisfying certain axioms."},{question:"What is linear independence?",options:["When vectors are perpendicular to each other","When no vector in a set can be written as a linear combination of the others","When vectors have the same magnitude","When vectors point in the same direction"],correct_answer:"When no vector in a set can be written as a linear combination of the others",answer:"",explanation:"A set of vectors is linearly independent if no vector in the set can be expressed as a linear combination of the other vectors."}],mindmap:'{"nodes":[{"id":"root","text":"Linear Algebra","fx":400,"fy":200},{"id":"node1","text":"Vector Spaces","fx":200,"fy":100},{"id":"node2","text":"Linear Transformations","fx":600,"fy":100},{"id":"node3","text":"Matrices","fx":200,"fy":300},{"id":"node4","text":"Eigenvalues & Eigenvectors","fx":600,"fy":300}],"links":[{"source":"root","target":"node1"},{"source":"root","target":"node2"},{"source":"root","target":"node3"},{"source":"root","target":"node4"},{"source":"node1","target":"node3"},{"source":"node2","target":"node3"},{"source":"node3","target":"node4"}]}',video_url:"https://example.com/videos/linear-algebra-intro.mp4",roleplay:{scenarios:[{id:"1",title:"Professor and Student Discussion",description:"A conversation between a math professor and a student trying to understand vector spaces.",characters:[{id:"prof",name:"Professor Smith",description:"An experienced mathematics professor specializing in linear algebra."},{id:"student",name:"Alex",description:"A curious student trying to understand the fundamentals of vector spaces."}],initialPrompt:"Alex approaches Professor Smith after class with questions about vector spaces.",relatedCourse:"Linear Algebra"}]},latex_code:"\\begin{align} V = \\{v_1, v_2, \\ldots, v_n\\} \\end{align}"},ge={title:"Course/CourseContentRenderer",component:I,parameters:{layout:"fullscreen",backgrounds:{default:"dark"}},decorators:[P=>d.jsx("div",{className:"min-h-screen bg-gray-900",children:d.jsx(N,{children:d.jsx(P,{})})})],argTypes:{onMindmapBack:{action:"mindmap back clicked"},onToggleMindmapFullscreen:{action:"toggle mindmap fullscreen clicked"},onCloseReport:{action:"close report clicked"},onGenerateContentRequest:{action:"generate content requested"}}},t={args:{activeTab:"notes",content:a,chapter:e,language:"English",chaptersMeta:[e],isLoading:!1,showReport:!1,isFullscreenMindmap:!1,sidebarOpen:!0}},n={args:{activeTab:"summary",content:a,chapter:e,language:"English",chaptersMeta:[e],isLoading:!1,showReport:!1,isFullscreenMindmap:!1,sidebarOpen:!0}},r={args:{activeTab:"quiz",content:a,chapter:e,language:"English",chaptersMeta:[e],isLoading:!1,showReport:!1,isFullscreenMindmap:!1,sidebarOpen:!0}},s={args:{activeTab:"mindmap",content:a,chapter:e,language:"English",chaptersMeta:[e],isLoading:!1,showReport:!1,isFullscreenMindmap:!1,sidebarOpen:!0}},o={args:{activeTab:"mindmap",content:a,chapter:e,language:"English",chaptersMeta:[e],isLoading:!1,showReport:!1,isFullscreenMindmap:!0,sidebarOpen:!0}},i={args:{activeTab:"video",content:a,chapter:e,language:"English",chaptersMeta:[e],isLoading:!1,showReport:!1,isFullscreenMindmap:!1,sidebarOpen:!0}},c={args:{activeTab:"roleplay",content:a,chapter:e,language:"English",chaptersMeta:[e],isLoading:!1,showReport:!1,isFullscreenMindmap:!1,sidebarOpen:!0}},p={args:{activeTab:"notes",content:a,chapter:e,language:"English",chaptersMeta:[e],isLoading:!0,showReport:!1,isFullscreenMindmap:!1,sidebarOpen:!0}},l={args:{activeTab:"notes",content:{notes:a.notes},chapter:e,language:"English",chaptersMeta:[e],isLoading:!1,showReport:!1,isFullscreenMindmap:!1,sidebarOpen:!0}};var m,u,h;t.parameters={...t.parameters,docs:{...(m=t.parameters)==null?void 0:m.docs,source:{originalSource:`{
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
}`,...(h=(u=t.parameters)==null?void 0:u.docs)==null?void 0:h.source}}};var g,f,b;n.parameters={...n.parameters,docs:{...(g=n.parameters)==null?void 0:g.docs,source:{originalSource:`{
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
}`,...(b=(f=n.parameters)==null?void 0:f.docs)==null?void 0:b.source}}};var v,M,k;r.parameters={...r.parameters,docs:{...(v=r.parameters)==null?void 0:v.docs,source:{originalSource:`{
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
}`,...(k=(M=r.parameters)==null?void 0:M.docs)==null?void 0:k.source}}};var C,T,w;s.parameters={...s.parameters,docs:{...(C=s.parameters)==null?void 0:C.docs,source:{originalSource:`{
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
}`,...(w=(T=s.parameters)==null?void 0:T.docs)==null?void 0:w.source}}};var x,y,L;o.parameters={...o.parameters,docs:{...(x=o.parameters)==null?void 0:x.docs,source:{originalSource:`{
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
}`,...(L=(y=o.parameters)==null?void 0:y.docs)==null?void 0:L.source}}};var R,E,F;i.parameters={...i.parameters,docs:{...(R=i.parameters)==null?void 0:R.docs,source:{originalSource:`{
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
}`,...(F=(E=i.parameters)==null?void 0:E.docs)==null?void 0:F.source}}};var O,S,_;c.parameters={...c.parameters,docs:{...(O=c.parameters)==null?void 0:O.docs,source:{originalSource:`{
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
}`,...(_=(S=c.parameters)==null?void 0:S.docs)==null?void 0:_.source}}};var A,q,W;p.parameters={...p.parameters,docs:{...(A=p.parameters)==null?void 0:A.docs,source:{originalSource:`{
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
}`,...(W=(q=p.parameters)==null?void 0:q.docs)==null?void 0:W.source}}};var z,V,j;l.parameters={...l.parameters,docs:{...(z=l.parameters)==null?void 0:z.docs,source:{originalSource:`{
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
}`,...(j=(V=l.parameters)==null?void 0:V.docs)==null?void 0:j.source}}};const fe=["NotesTab","SummaryTab","QuizTab","MindmapTab","MindmapFullscreen","VideoTab","RoleplayTab","LoadingState","WithMissingContent"];export{p as LoadingState,o as MindmapFullscreen,s as MindmapTab,t as NotesTab,r as QuizTab,c as RoleplayTab,n as SummaryTab,i as VideoTab,l as WithMissingContent,fe as __namedExportsOrder,ge as default};
//# sourceMappingURL=CourseContentRenderer.stories-D9iaU9AF.js.map
