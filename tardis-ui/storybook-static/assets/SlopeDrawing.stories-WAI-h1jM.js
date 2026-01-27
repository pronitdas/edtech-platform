import{S as s}from"./SlopeDrawing-B-4jfn4q.js";import"./iframe-Baxcka9q.js";import"./GraphCanvas-CfIB4xN4.js";import"./DrawingToolbar-fcU_C2XG.js";const l={title:"Slope/SlopeDrawing",component:s,parameters:{layout:"fullscreen"},tags:["autodocs"]},o={id:"sample-content",title:"Understanding Slope",description:"Learn about different types of slopes and how to calculate them.",type:"slope-drawing",data:{conceptExplanations:[{id:"positive",title:"Positive Slope",content:"A line that rises from left to right has a positive slope.",formula:"$$m = \\frac{y_2 - y_1}{x_2 - x_1} > 0$$",demoPoints:[{x:-2,y:-1},{x:2,y:3}]},{id:"negative",title:"Negative Slope",content:"A line that falls from left to right has a negative slope.",formula:"$$m = \\frac{y_2 - y_1}{x_2 - x_1} < 0$$",demoPoints:[{x:-2,y:3},{x:2,y:-1}]}],problems:[{id:"prob-1",question:"Draw a line with slope = 2",difficulty:"easy",solution:{slope:2,yIntercept:0},hints:["Try starting at the origin (0,0)"]},{id:"prob-2",question:"Draw a line with slope = -1",difficulty:"medium",solution:{slope:-1,yIntercept:0},hints:["Think about what negative slope means"]}]}},t={args:{interactiveContent:o,userId:"user-123",knowledgeId:"knowledge-456",language:"en",onUpdateProgress:e=>console.log("Progress updated:",e)}},n={args:{interactiveContent:o,userId:"user-123",knowledgeId:"knowledge-456",language:"en",onUpdateProgress:e=>console.log("Progress updated:",e),openaiClient:{generateResponse:async e=>(console.log("OpenAI prompt:",e),"Sample OpenAI response")}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    interactiveContent: sampleInteractiveContent,
    userId: 'user-123',
    knowledgeId: 'knowledge-456',
    language: 'en',
    onUpdateProgress: progress => console.log('Progress updated:', progress)
  }
}`,...t.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
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
      }
    }
  }
}`,...n.parameters?.docs?.source}}};const d=["Default","WithOpenAI"];export{t as Default,n as WithOpenAI,d as __namedExportsOrder,l as default};
//# sourceMappingURL=SlopeDrawing.stories-WAI-h1jM.js.map
