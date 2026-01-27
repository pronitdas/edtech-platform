import{j as e,I as c}from"./iframe-Baxcka9q.js";import{L as d,a as i}from"./LearningReport-SAKc6_Ha.js";import"./createLucideIcon-BhHhnBlm.js";import"./brain-5hf2MatN.js";import"./utils-CbZsw6Wr.js";import"./index-C-cy63yR.js";import"./index-BwObycI8.js";import"./button-DXArZr2y.js";import"./index-Dg-g8a3P.js";import"./x-DqPFOomp.js";import"./loader-circle-8XdIYPpo.js";i.getUserCompletion;const m={engagement_score:75,understanding:"Proficient",strengths:["Concept visualization","Problem-solving approach"],weaknesses:["Mathematical notation","Advanced theorems"],recommendations:["Review the properties of matrices","Practice more eigenvalue problems","Study the relationship between linear transformations and matrices"]},x={title:"Course/LearningReport",component:d,parameters:{layout:"fullscreen",backgrounds:{default:"dark"}},argTypes:{userId:{control:"text"},knowledgeId:{control:"text"},onClose:{action:"report closed"}},decorators:[r=>(i.getUserCompletion=async()=>m,e.jsx("div",{className:"min-h-screen bg-gray-900",children:e.jsx(c,{children:e.jsx(r,{})})}))]},s={args:{userId:"user123",knowledgeId:"456"}},n={args:{userId:"user123",knowledgeId:"789"}},o={args:{userId:"user456",knowledgeId:"456"}},t={decorators:[r=>(i.getUserCompletion=()=>new Promise(()=>{}),e.jsx("div",{className:"min-h-screen bg-gray-900",children:e.jsx(c,{children:e.jsx(r,{})})}))],args:{userId:"user123",knowledgeId:"456"}},a={decorators:[r=>(i.getUserCompletion=()=>Promise.reject("Error fetching analytics"),e.jsx("div",{className:"min-h-screen bg-gray-900",children:e.jsx(c,{children:e.jsx(r,{})})}))],args:{userId:"user123",knowledgeId:"456"}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    userId: 'user123',
    knowledgeId: '456'
  }
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    userId: 'user123',
    knowledgeId: '789'
  }
}`,...n.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    userId: 'user456',
    knowledgeId: '456'
  }
}`,...o.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
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
}`,...t.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
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
}`,...a.parameters?.docs?.source}}};const j=["Default","WithDifferentKnowledgeId","WithDifferentUser","Loading","Error"];export{s as Default,a as Error,t as Loading,n as WithDifferentKnowledgeId,o as WithDifferentUser,j as __namedExportsOrder,x as default};
//# sourceMappingURL=LearningReport.stories-CtaG6yFv.js.map
