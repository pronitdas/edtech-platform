import{j as p}from"./jsx-runtime-D_zvdyIk.js";import{G as W}from"./GraphCanvas-BCuXRoXj.js";import{I as D}from"./InteractionTrackerContextMock-CA1BdasH.js";import"./index-oxIuDU2I.js";import"./_commonjsHelpers-CqkleIqs.js";const F={title:"Slope/GraphCanvas",component:W,parameters:{layout:"centered"},tags:["autodocs"],decorators:[o=>p.jsx("div",{style:{width:"600px",height:"400px",background:"#1a1a1a"},children:p.jsx(D,{children:p.jsx(o,{})})})]},A=o=>({x:(o.x+10)*30,y:(10-o.y)*30}),H=o=>({x:o.x/30-10,y:10-o.y/30}),n={width:600,height:400,zoom:1,offset:{x:0,y:0},onZoomChange:o=>console.log("Zoom changed:",o),onOffsetChange:o=>console.log("Offset changed:",o),mapPointToCanvas:A,mapCanvasToPoint:H,editMode:!0,drawingTool:"move",onDrawingToolChange:o=>console.log("Tool changed:",o),drawingMode:"slope",slopeConfig:{equation:"y = mx + b",xRange:[-10,10],yRange:[-10,10],stepSize:.1}},e={args:{...n,points:[],onPointsChange:o=>console.log("Points changed:",o)}},s={args:{width:600,height:400,zoom:1,offset:{x:0,y:0},onZoomChange:o=>console.log("Zoom changed:",o),onOffsetChange:o=>console.log("Offset changed:",o),drawingMode:"generic"}},a={args:{...n,points:[{x:-2,y:1},{x:2,y:5}],onPointsChange:o=>console.log("Points changed:",o)}},t={args:{...n,points:[{x:-2,y:1},{x:2,y:5}],zoom:1.5,offset:{x:50,y:-30},onPointsChange:o=>console.log("Points changed:",o)}},r={args:{...n,points:[{x:-2,y:1},{x:2,y:5}],editMode:!1,onPointsChange:o=>console.log("Points changed:",o)}},i={args:{...n,points:[{x:-2,y:-2},{x:2,y:2}],highlightSolution:!0,onPointsChange:o=>console.log("Points changed:",o)}},c={args:{...n,points:[],drawingTool:"solidLine",onPointsChange:o=>console.log("Points changed:",o)}},g={args:{...n,points:[{x:-4,y:-2},{x:-2,y:1},{x:0,y:0},{x:2,y:3},{x:4,y:2}],onPointsChange:o=>console.log("Points changed:",o)}};var d,l,h;e.parameters={...e.parameters,docs:{...(d=e.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    ...baseProps,
    points: [],
    onPointsChange: points => console.log('Points changed:', points)
  }
}`,...(h=(l=e.parameters)==null?void 0:l.docs)==null?void 0:h.source}}};var m,x,P;s.parameters={...s.parameters,docs:{...(m=s.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    width: 600,
    height: 400,
    zoom: 1,
    offset: {
      x: 0,
      y: 0
    },
    onZoomChange: (zoom: number) => console.log('Zoom changed:', zoom),
    onOffsetChange: (offset: {
      x: number;
      y: number;
    }) => console.log('Offset changed:', offset),
    drawingMode: 'generic' as const
    // Generic mode might not need point mapping or drawing tools props
  }
}`,...(P=(x=s.parameters)==null?void 0:x.docs)==null?void 0:P.source}}};var y,u,f;a.parameters={...a.parameters,docs:{...(y=a.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    ...baseProps,
    points: [{
      x: -2,
      y: 1
    }, {
      x: 2,
      y: 5
    }],
    onPointsChange: points => console.log('Points changed:', points)
  }
}`,...(f=(u=a.parameters)==null?void 0:u.docs)==null?void 0:f.source}}};var C,w,M;t.parameters={...t.parameters,docs:{...(C=t.parameters)==null?void 0:C.docs,source:{originalSource:`{
  args: {
    ...baseProps,
    points: [{
      x: -2,
      y: 1
    }, {
      x: 2,
      y: 5
    }],
    zoom: 1.5,
    offset: {
      x: 50,
      y: -30
    },
    onPointsChange: points => console.log('Points changed:', points)
  }
}`,...(M=(w=t.parameters)==null?void 0:w.docs)==null?void 0:M.source}}};var S,b,G;r.parameters={...r.parameters,docs:{...(S=r.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    ...baseProps,
    points: [{
      x: -2,
      y: 1
    }, {
      x: 2,
      y: 5
    }],
    editMode: false,
    onPointsChange: points => console.log('Points changed:', points)
  }
}`,...(G=(b=r.parameters)==null?void 0:b.docs)==null?void 0:G.source}}};var T,v,O;i.parameters={...i.parameters,docs:{...(T=i.parameters)==null?void 0:T.docs,source:{originalSource:`{
  args: {
    ...baseProps,
    points: [{
      x: -2,
      y: -2
    }, {
      x: 2,
      y: 2
    }],
    highlightSolution: true,
    onPointsChange: points => console.log('Points changed:', points)
  }
}`,...(O=(v=i.parameters)==null?void 0:v.docs)==null?void 0:O.source}}};var z,Z,j;c.parameters={...c.parameters,docs:{...(z=c.parameters)==null?void 0:z.docs,source:{originalSource:`{
  args: {
    ...baseProps,
    points: [],
    drawingTool: 'solidLine',
    onPointsChange: points => console.log('Points changed:', points)
  }
}`,...(j=(Z=c.parameters)==null?void 0:Z.docs)==null?void 0:j.source}}};var R,k,E;g.parameters={...g.parameters,docs:{...(R=g.parameters)==null?void 0:R.docs,source:{originalSource:`{
  args: {
    ...baseProps,
    points: [{
      x: -4,
      y: -2
    }, {
      x: -2,
      y: 1
    }, {
      x: 0,
      y: 0
    }, {
      x: 2,
      y: 3
    }, {
      x: 4,
      y: 2
    }],
    onPointsChange: points => console.log('Points changed:', points)
  }
}`,...(E=(k=g.parameters)==null?void 0:k.docs)==null?void 0:E.source}}};const J=["EmptyGraph","GenericGraph","WithPoints","WithZoomAndPan","ReadOnlyMode","HighlightedSolution","DrawingMode","MultiplePoints"];export{c as DrawingMode,e as EmptyGraph,s as GenericGraph,i as HighlightedSolution,g as MultiplePoints,r as ReadOnlyMode,a as WithPoints,t as WithZoomAndPan,J as __namedExportsOrder,F as default};
//# sourceMappingURL=GraphCanvas.stories-CR4N3fEH.js.map
