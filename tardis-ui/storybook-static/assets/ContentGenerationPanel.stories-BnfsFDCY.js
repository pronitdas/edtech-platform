import{j as i}from"./jsx-runtime-D_zvdyIk.js";import{C as k}from"./ContentGenerationPanel-B-D_Fqro.js";import"./createLucideIcon-DUWlDEBy.js";import"./index-oxIuDU2I.js";import"./_commonjsHelpers-CqkleIqs.js";import"./file-text-flb9FPSV.js";import"./circle-question-mark-Dj2ml970.js";import"./circle-alert-CX6K2IxP.js";import"./loader-circle-qNWLSv1Y.js";const e={id:1,chaptertitle:"Introduction to Linear Algebra",subtopic:"Vectors and Vector Spaces",topic:"Linear Algebra",knowledge_id:123,chapter:"This is the original chapter content.",chapter_type:"text",context:null,created_at:"2023-01-01T00:00:00Z",k_id:123,level:1,lines:100,metadata:null,needs_code:!1,needs_latex:!0,needs_roleplay:!1,seeded:!0,timestamp_end:600,timestamp_start:0,type:"lecture"},L={title:"Course/ContentGenerationPanel",component:k,parameters:{layout:"centered",backgrounds:{default:"dark"}},decorators:[_=>i.jsx("div",{className:"relative h-[600px] w-[400px] bg-gray-900",children:i.jsx(_,{})})],argTypes:{onGenerate:{action:"generate content"},onClose:{action:"close panel"}}},n={args:{chapter:e,language:"English",missingTypes:["notes","quiz","mindmap"],generatingTypes:[],isGenerating:!1}},a={args:{chapter:e,language:"English",missingTypes:[],generatingTypes:[],isGenerating:!1}},t={args:{chapter:e,language:"English",missingTypes:["notes","quiz","mindmap"],generatingTypes:["notes"],isGenerating:!0}},s={args:{chapter:e,language:"English",missingTypes:["notes","quiz","mindmap","summary"],generatingTypes:["notes","quiz"],isGenerating:!0}},r={args:{chapter:e,language:"Hindi",missingTypes:["notes","mindmap"],generatingTypes:[],isGenerating:!1}};var o,p,g;n.parameters={...n.parameters,docs:{...(o=n.parameters)==null?void 0:o.docs,source:{originalSource:`{
  args: {
    chapter: mockChapter,
    language: 'English',
    missingTypes: ['notes', 'quiz', 'mindmap'] as ContentType[],
    generatingTypes: [] as ContentType[],
    isGenerating: false
  }
}`,...(g=(p=n.parameters)==null?void 0:p.docs)==null?void 0:g.source}}};var c,m,l;a.parameters={...a.parameters,docs:{...(c=a.parameters)==null?void 0:c.docs,source:{originalSource:`{
  args: {
    chapter: mockChapter,
    language: 'English',
    missingTypes: [] as ContentType[],
    generatingTypes: [] as ContentType[],
    isGenerating: false
  }
}`,...(l=(m=a.parameters)==null?void 0:m.docs)==null?void 0:l.source}}};var u,d,y;t.parameters={...t.parameters,docs:{...(u=t.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    chapter: mockChapter,
    language: 'English',
    missingTypes: ['notes', 'quiz', 'mindmap'] as ContentType[],
    generatingTypes: ['notes'] as ContentType[],
    isGenerating: true
  }
}`,...(y=(d=t.parameters)==null?void 0:d.docs)==null?void 0:y.source}}};var h,T,C;s.parameters={...s.parameters,docs:{...(h=s.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    chapter: mockChapter,
    language: 'English',
    missingTypes: ['notes', 'quiz', 'mindmap', 'summary'] as ContentType[],
    generatingTypes: ['notes', 'quiz'] as ContentType[],
    isGenerating: true
  }
}`,...(C=(T=s.parameters)==null?void 0:T.docs)==null?void 0:C.source}}};var G,f,x;r.parameters={...r.parameters,docs:{...(G=r.parameters)==null?void 0:G.docs,source:{originalSource:`{
  args: {
    chapter: mockChapter,
    language: 'Hindi',
    missingTypes: ['notes', 'mindmap'] as ContentType[],
    generatingTypes: [] as ContentType[],
    isGenerating: false
  }
}`,...(x=(f=r.parameters)==null?void 0:f.docs)==null?void 0:x.source}}};const M=["WithMissingContent","WithAllContentAvailable","GeneratingNotes","GeneratingMultipleTypes","WithDifferentLanguage"];export{s as GeneratingMultipleTypes,t as GeneratingNotes,a as WithAllContentAvailable,r as WithDifferentLanguage,n as WithMissingContent,M as __namedExportsOrder,L as default};
//# sourceMappingURL=ContentGenerationPanel.stories-BnfsFDCY.js.map
