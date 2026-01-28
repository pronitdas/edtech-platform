import{S as d}from"./SlopeDrawing-Dgc_oX9g.js";import"./jsx-runtime-D_zvdyIk.js";import"./index-oxIuDU2I.js";import"./_commonjsHelpers-CqkleIqs.js";import"./GraphCanvas-BCuXRoXj.js";import"./DrawingToolbar-Bna5UYmO.js";const I={title:"Slope/SlopeDrawing",component:d,parameters:{layout:"fullscreen"},tags:["autodocs"]},l={id:"sample-content",title:"Understanding Slope",description:"Learn about different types of slopes and how to calculate them.",type:"slope-drawing",data:{conceptExplanations:[{id:"positive",title:"Positive Slope",content:"A line that rises from left to right has a positive slope.",formula:"$$m = \\frac{y_2 - y_1}{x_2 - x_1} > 0$$",demoPoints:[{x:-2,y:-1},{x:2,y:3}]},{id:"negative",title:"Negative Slope",content:"A line that falls from left to right has a negative slope.",formula:"$$m = \\frac{y_2 - y_1}{x_2 - x_1} < 0$$",demoPoints:[{x:-2,y:3},{x:2,y:-1}]}],problems:[{id:"prob-1",question:"Draw a line with slope = 2",difficulty:"easy",solution:{slope:2,yIntercept:0},hints:["Try starting at the origin (0,0)"]},{id:"prob-2",question:"Draw a line with slope = -1",difficulty:"medium",solution:{slope:-1,yIntercept:0},hints:["Think about what negative slope means"]}]}},n={args:{interactiveContent:l,userId:"user-123",knowledgeId:"knowledge-456",language:"en",onUpdateProgress:e=>console.log("Progress updated:",e)}},t={args:{interactiveContent:l,userId:"user-123",knowledgeId:"knowledge-456",language:"en",onUpdateProgress:e=>console.log("Progress updated:",e),openaiClient:{generateResponse:async e=>(console.log("OpenAI prompt:",e),"Sample OpenAI response"),chatCompletion:async()=>"Sample OpenAI response"}}};var o,s,r;n.parameters={...n.parameters,docs:{...(o=n.parameters)==null?void 0:o.docs,source:{originalSource:`{
  args: {
    interactiveContent: sampleInteractiveContent,
    userId: 'user-123',
    knowledgeId: 'knowledge-456',
    language: 'en',
    onUpdateProgress: progress => console.log('Progress updated:', progress)
  }
}`,...(r=(s=n.parameters)==null?void 0:s.docs)==null?void 0:r.source}}};var a,p,i;t.parameters={...t.parameters,docs:{...(a=t.parameters)==null?void 0:a.docs,source:{originalSource:`{
  args: {
    interactiveContent: sampleInteractiveContent,
    userId: 'user-123',
    knowledgeId: 'knowledge-456',
    language: 'en',
    onUpdateProgress: progress => console.log('Progress updated:', progress),
    openaiClient: {
      generateResponse: async prompt => {
        console.log('OpenAI prompt:', prompt);
        return 'Sample OpenAI response';
      },
      chatCompletion: async () => {
        return 'Sample OpenAI response';
      }
    }
  }
}`,...(i=(p=t.parameters)==null?void 0:p.docs)==null?void 0:i.source}}};const h=["Default","WithOpenAI"];export{n as Default,t as WithOpenAI,h as __namedExportsOrder,I as default};
//# sourceMappingURL=SlopeDrawing.stories-CAd92v33.js.map
