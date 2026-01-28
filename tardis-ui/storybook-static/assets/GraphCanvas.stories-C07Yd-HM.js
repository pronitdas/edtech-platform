import{j as i}from"./jsx-runtime-D_zvdyIk.js";import{r}from"./index-oxIuDU2I.js";import{G as f}from"./GraphCanvas-BCuXRoXj.js";import{I as P}from"./InteractionTrackerContextMock-CA1BdasH.js";import"./_commonjsHelpers-CqkleIqs.js";const k={title:"Components/GraphCanvas",component:f,decorators:[n=>i.jsx(P,{children:i.jsx(n,{})})]},g=n=>{const[o,t]=r.useState(1),[v,y]=r.useState({x:0,y:0}),C=e=>({x:e.x*50+200,y:200-e.y*50}),h=e=>({x:(e.x-200)/50,y:(200-e.y)/50});return i.jsx("div",{style:{border:"1px solid #ccc",padding:"8px"},children:i.jsx(f,{...n,zoom:o,offset:v,onZoomChange:t,onOffsetChange:y,mapPointToCanvas:C,mapCanvasToPoint:h})})},a=g.bind({});a.args={width:400,height:400,renderingMode:"svg",points:[{x:-2,y:1},{x:0,y:0},{x:2,y:2}],lines:[{start:{x:-2,y:-2},end:{x:2,y:2},color:"blue",strokeWidth:2}],shapes:[{type:"rectangle",topLeft:{x:-1,y:-1},bottomRight:{x:1,y:1},fill:"rgba(200, 200, 200, 0.5)"}],texts:[{text:"Click me!",position:{x:0,y:2},fontSize:"14px"}],onElementClick:(n,o,t)=>{console.log("Clicked element:",{type:n,index:o,data:t}),alert(`Clicked ${n} at index ${o}`)}};const s=g.bind({});s.args={width:400,height:400,renderingMode:"p5",drawingMode:"slope",points:[{x:-1,y:-1},{x:1,y:1}],customPoints:[{x:0,y:0}],customLines:[{start:{x:-2,y:0},end:{x:2,y:0},color:"red"}],shapes:[{type:"rectangle",topLeft:{x:-.5,y:-.5},bottomRight:{x:.5,y:.5},fill:"rgba(100, 200, 100, 0.3)"}],texts:[{text:"Origin",position:{x:0,y:-.2}}],onElementClick:(n,o,t)=>{console.log("Clicked element:",{type:n,index:o,data:t}),alert(`Clicked ${n} at index ${o}`)},editMode:!0,drawingTool:"point",highlightSolution:!1};var c,p,m;a.parameters={...a.parameters,docs:{...(c=a.parameters)==null?void 0:c.docs,source:{originalSource:`args => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({
    x: 0,
    y: 0
  });
  const mapPointToCanvas = (point: Point): Point => ({
    x: point.x * 50 + 200,
    // Scale and center the points
    y: 200 - point.y * 50 // Flip Y axis and scale
  });
  const mapCanvasToPoint = (canvasPoint: {
    x: number;
    y: number;
  }): Point => ({
    x: (canvasPoint.x - 200) / 50,
    y: (200 - canvasPoint.y) / 50
  });
  return <div style={{
    border: '1px solid #ccc',
    padding: '8px'
  }}>
      <GraphCanvas {...args} zoom={zoom} offset={offset} onZoomChange={setZoom} onOffsetChange={setOffset} mapPointToCanvas={mapPointToCanvas} mapCanvasToPoint={mapCanvasToPoint} />
    </div>;
}`,...(m=(p=a.parameters)==null?void 0:p.docs)==null?void 0:m.source}}};var x,d,l;s.parameters={...s.parameters,docs:{...(x=s.parameters)==null?void 0:x.docs,source:{originalSource:`args => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({
    x: 0,
    y: 0
  });
  const mapPointToCanvas = (point: Point): Point => ({
    x: point.x * 50 + 200,
    // Scale and center the points
    y: 200 - point.y * 50 // Flip Y axis and scale
  });
  const mapCanvasToPoint = (canvasPoint: {
    x: number;
    y: number;
  }): Point => ({
    x: (canvasPoint.x - 200) / 50,
    y: (200 - canvasPoint.y) / 50
  });
  return <div style={{
    border: '1px solid #ccc',
    padding: '8px'
  }}>
      <GraphCanvas {...args} zoom={zoom} offset={offset} onZoomChange={setZoom} onOffsetChange={setOffset} mapPointToCanvas={mapPointToCanvas} mapCanvasToPoint={mapCanvasToPoint} />
    </div>;
}`,...(l=(d=s.parameters)==null?void 0:d.docs)==null?void 0:l.source}}};const E=["InteractiveSvgExample","InteractiveP5Example"];export{s as InteractiveP5Example,a as InteractiveSvgExample,E as __namedExportsOrder,k as default};
//# sourceMappingURL=GraphCanvas.stories-C07Yd-HM.js.map
