import{j as i}from"./iframe-Baxcka9q.js";import{C as p}from"./ContentGenerationPanel-B9O39mP5.js";import"./createLucideIcon-BhHhnBlm.js";import"./file-text-Bi346tWK.js";import"./circle-question-mark-CgAfY6ym.js";import"./circle-alert-mwexni2a.js";import"./loader-circle-8XdIYPpo.js";const e={id:1,chaptertitle:"Introduction to Linear Algebra",subtopic:"Vectors and Vector Spaces",topic:"Linear Algebra",knowledge_id:123,chapter:"This is the original chapter content.",chapter_type:"text",context:null,created_at:"2023-01-01T00:00:00Z",k_id:123,level:1,lines:100,metadata:null,needs_code:!1,needs_latex:!0,needs_roleplay:!1,seeded:!0,timestamp_end:600,timestamp_start:0,type:"lecture"},h={title:"Course/ContentGenerationPanel",component:p,parameters:{layout:"centered",backgrounds:{default:"dark"}},decorators:[o=>i.jsx("div",{className:"relative h-[600px] w-[400px] bg-gray-900",children:i.jsx(o,{})})],argTypes:{onGenerate:{action:"generate content"},onClose:{action:"close panel"}}},n={args:{chapter:e,language:"English",missingTypes:["notes","quiz","mindmap"],generatingTypes:[],isGenerating:!1}},a={args:{chapter:e,language:"English",missingTypes:[],generatingTypes:[],isGenerating:!1}},t={args:{chapter:e,language:"English",missingTypes:["notes","quiz","mindmap"],generatingTypes:["notes"],isGenerating:!0}},s={args:{chapter:e,language:"English",missingTypes:["notes","quiz","mindmap","summary"],generatingTypes:["notes","quiz"],isGenerating:!0}},r={args:{chapter:e,language:"Hindi",missingTypes:["notes","mindmap"],generatingTypes:[],isGenerating:!1}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    chapter: mockChapter,
    language: 'English',
    missingTypes: ['notes', 'quiz', 'mindmap'] as ContentType[],
    generatingTypes: [] as ContentType[],
    isGenerating: false
  }
}`,...n.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    chapter: mockChapter,
    language: 'English',
    missingTypes: [] as ContentType[],
    generatingTypes: [] as ContentType[],
    isGenerating: false
  }
}`,...a.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    chapter: mockChapter,
    language: 'English',
    missingTypes: ['notes', 'quiz', 'mindmap'] as ContentType[],
    generatingTypes: ['notes'] as ContentType[],
    isGenerating: true
  }
}`,...t.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    chapter: mockChapter,
    language: 'English',
    missingTypes: ['notes', 'quiz', 'mindmap', 'summary'] as ContentType[],
    generatingTypes: ['notes', 'quiz'] as ContentType[],
    isGenerating: true
  }
}`,...s.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    chapter: mockChapter,
    language: 'Hindi',
    missingTypes: ['notes', 'mindmap'] as ContentType[],
    generatingTypes: [] as ContentType[],
    isGenerating: false
  }
}`,...r.parameters?.docs?.source}}};const T=["WithMissingContent","WithAllContentAvailable","GeneratingNotes","GeneratingMultipleTypes","WithDifferentLanguage"];export{s as GeneratingMultipleTypes,t as GeneratingNotes,a as WithAllContentAvailable,r as WithDifferentLanguage,n as WithMissingContent,T as __namedExportsOrder,h as default};
//# sourceMappingURL=ContentGenerationPanel.stories-Dn9-nzHS.js.map
