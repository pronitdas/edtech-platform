import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{L as S,a as i}from"./LearningReport-DzsWHkdl.js";import{I as c}from"./InteractionTrackerContextMock-CA1BdasH.js";import"./index-oxIuDU2I.js";import"./_commonjsHelpers-CqkleIqs.js";import"./createLucideIcon-DUWlDEBy.js";import"./brain-3icWCldh.js";import"./utils-Ba4dZznC.js";import"./index-0JNj-DyH.js";import"./index-ChhEEol8.js";import"./tiny-invariant-CopsF_GD.js";import"./button-eFm21kA6.js";import"./index-BABKXdJD.js";import"./x-DCH7TPgH.js";import"./loader-circle-qNWLSv1Y.js";i.getUserCompletion;const P={engagement_score:75,understanding:"Proficient",strengths:["Concept visualization","Problem-solving approach"],weaknesses:["Mathematical notation","Advanced theorems"],recommendations:["Review the properties of matrices","Practice more eigenvalue problems","Study the relationship between linear transformations and matrices"]},M={title:"Course/LearningReport",component:S,parameters:{layout:"fullscreen",backgrounds:{default:"dark"}},argTypes:{userId:{control:"text"},knowledgeId:{control:"text"},onClose:{action:"report closed"}},decorators:[r=>(i.getUserCompletion=async()=>P,e.jsx("div",{className:"min-h-screen bg-gray-900",children:e.jsx(c,{children:e.jsx(r,{})})}))]},s={args:{userId:"user123",knowledgeId:"456"}},n={args:{userId:"user123",knowledgeId:"789"}},o={args:{userId:"user456",knowledgeId:"456"}},t={decorators:[r=>(i.getUserCompletion=()=>new Promise(()=>{}),e.jsx("div",{className:"min-h-screen bg-gray-900",children:e.jsx(c,{children:e.jsx(r,{})})}))],args:{userId:"user123",knowledgeId:"456"}},a={decorators:[r=>(i.getUserCompletion=()=>Promise.reject("Error fetching analytics"),e.jsx("div",{className:"min-h-screen bg-gray-900",children:e.jsx(c,{children:e.jsx(r,{})})}))],args:{userId:"user123",knowledgeId:"456"}};var d,m,l;s.parameters={...s.parameters,docs:{...(d=s.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    userId: 'user123',
    knowledgeId: '456'
  }
}`,...(l=(m=s.parameters)==null?void 0:m.docs)==null?void 0:l.source}}};var g,u,p;n.parameters={...n.parameters,docs:{...(g=n.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    userId: 'user123',
    knowledgeId: '789'
  }
}`,...(p=(u=n.parameters)==null?void 0:u.docs)==null?void 0:p.source}}};var I,h,v;o.parameters={...o.parameters,docs:{...(I=o.parameters)==null?void 0:I.docs,source:{originalSource:`{
  args: {
    userId: 'user456',
    knowledgeId: '456'
  }
}`,...(v=(h=o.parameters)==null?void 0:h.docs)==null?void 0:v.source}}};var f,k,w;t.parameters={...t.parameters,docs:{...(f=t.parameters)==null?void 0:f.docs,source:{originalSource:`{
  decorators: [Story => {
    // Override with a function that never resolves to simulate loading
    analyticsService.getUserCompletion = () => new Promise(() => {});
    return <div className='min-h-screen bg-gray-900'>
          <InteractionTrackerProvider>
            <Story />
          </InteractionTrackerProvider>
        </div>;
  }],
  args: {
    userId: 'user123',
    knowledgeId: '456'
  }
}`,...(w=(k=t.parameters)==null?void 0:k.docs)==null?void 0:w.source}}};var y,x,j;a.parameters={...a.parameters,docs:{...(y=a.parameters)==null?void 0:y.docs,source:{originalSource:`{
  decorators: [Story => {
    // Override with a function that rejects to simulate error
    analyticsService.getUserCompletion = () => Promise.reject('Error fetching analytics');
    return <div className='min-h-screen bg-gray-900'>
          <InteractionTrackerProvider>
            <Story />
          </InteractionTrackerProvider>
        </div>;
  }],
  args: {
    userId: 'user123',
    knowledgeId: '456'
  }
}`,...(j=(x=a.parameters)==null?void 0:x.docs)==null?void 0:j.source}}};const q=["Default","WithDifferentKnowledgeId","WithDifferentUser","Loading","Error"];export{s as Default,a as Error,t as Loading,n as WithDifferentKnowledgeId,o as WithDifferentUser,q as __namedExportsOrder,M as default};
//# sourceMappingURL=LearningReport.stories-BYnCYWWP.js.map
