import{j as p}from"./iframe-Baxcka9q.js";import{G as d}from"./GraphCanvas-CfIB4xN4.js";const P={title:"Slope/GraphCanvas",component:d,parameters:{layout:"centered"},tags:["autodocs"],decorators:[n=>p.jsx("div",{style:{width:"600px",height:"400px",background:"#1a1a1a"},children:p.jsx(n,{})})]},l=n=>({x:(n.x+10)*30,y:(10-n.y)*30}),h=n=>({x:n.x/30-10,y:10-n.y/30}),o={width:600,height:400,zoom:1,offset:{x:0,y:0},onZoomChange:n=>console.log("Zoom changed:",n),onOffsetChange:n=>console.log("Offset changed:",n),mapPointToCanvas:l,mapCanvasToPoint:h,editMode:!0,drawingTool:"move",onDrawingToolChange:n=>console.log("Tool changed:",n),drawingMode:"slope",slopeConfig:{equation:"y = mx + b",xRange:[-10,10],yRange:[-10,10],stepSize:.1}},e={args:{...o,points:[],onPointsChange:n=>console.log("Points changed:",n)}},s={args:{width:600,height:400,zoom:1,offset:{x:0,y:0},onZoomChange:n=>console.log("Zoom changed:",n),onOffsetChange:n=>console.log("Offset changed:",n),drawingMode:"generic"}},a={args:{...o,points:[{x:-2,y:1},{x:2,y:5}],onPointsChange:n=>console.log("Points changed:",n)}},t={args:{...o,points:[{x:-2,y:1},{x:2,y:5}],zoom:1.5,offset:{x:50,y:-30},onPointsChange:n=>console.log("Points changed:",n)}},r={args:{...o,points:[{x:-2,y:1},{x:2,y:5}],editMode:!1,onPointsChange:n=>console.log("Points changed:",n)}},i={args:{...o,points:[{x:-2,y:-2},{x:2,y:2}],highlightSolution:!0,onPointsChange:n=>console.log("Points changed:",n)}},g={args:{...o,points:[],drawingTool:"solidLine",onPointsChange:n=>console.log("Points changed:",n)}},c={args:{...o,points:[{x:-4,y:-2},{x:-2,y:1},{x:0,y:0},{x:2,y:3},{x:4,y:2}],onPointsChange:n=>console.log("Points changed:",n)}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    ...baseProps,
    points: [],
    onPointsChange: points => console.log('Points changed:', points)
  }
}`,...e.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
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
}`,...s.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
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
}`,...a.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
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
}`,...t.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
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
}`,...r.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
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
}`,...i.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    ...baseProps,
    points: [],
    drawingTool: 'solidLine',
    onPointsChange: points => console.log('Points changed:', points)
  }
}`,...g.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
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
}`,...c.parameters?.docs?.source}}};const y=["EmptyGraph","GenericGraph","WithPoints","WithZoomAndPan","ReadOnlyMode","HighlightedSolution","DrawingMode","MultiplePoints"];export{g as DrawingMode,e as EmptyGraph,s as GenericGraph,i as HighlightedSolution,c as MultiplePoints,r as ReadOnlyMode,a as WithPoints,t as WithZoomAndPan,y as __namedExportsOrder,P as default};
//# sourceMappingURL=GraphCanvas.stories-sVYxNd4G.js.map
