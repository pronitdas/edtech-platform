import{r as i,j as r}from"./iframe-Baxcka9q.js";import{G as c}from"./GraphCanvas-CfIB4xN4.js";const v={title:"Components/GraphCanvas",component:c},p=n=>{const[t,o]=i.useState(1),[m,x]=i.useState({x:0,y:0}),l=e=>({x:e.x*50+200,y:200-e.y*50}),d=e=>({x:(e.x-200)/50,y:(200-e.y)/50});return r.jsx("div",{style:{border:"1px solid #ccc",padding:"8px"},children:r.jsx(c,{...n,zoom:t,offset:m,onZoomChange:o,onOffsetChange:x,mapPointToCanvas:l,mapCanvasToPoint:d})})},a=p.bind({});a.args={width:400,height:400,renderingMode:"svg",points:[{x:-2,y:1},{x:0,y:0},{x:2,y:2}],lines:[{start:{x:-2,y:-2},end:{x:2,y:2},color:"blue",strokeWidth:2}],shapes:[{type:"rectangle",topLeft:{x:-1,y:-1},bottomRight:{x:1,y:1},fill:"rgba(200, 200, 200, 0.5)"}],texts:[{text:"Click me!",position:{x:0,y:2},fontSize:"14px"}],onElementClick:(n,t,o)=>{console.log("Clicked element:",{type:n,index:t,data:o}),alert(`Clicked ${n} at index ${t}`)}};const s=p.bind({});s.args={width:400,height:400,renderingMode:"p5",drawingMode:"slope",points:[{x:-1,y:-1},{x:1,y:1}],customPoints:[{x:0,y:0}],customLines:[{start:{x:-2,y:0},end:{x:2,y:0},color:"red"}],shapes:[{type:"rectangle",topLeft:{x:-.5,y:-.5},bottomRight:{x:.5,y:.5},fill:"rgba(100, 200, 100, 0.3)"}],texts:[{text:"Origin",position:{x:0,y:-.2}}],onElementClick:(n,t,o)=>{console.log("Clicked element:",{type:n,index:t,data:o}),alert(`Clicked ${n} at index ${t}`)},editMode:!0,drawingTool:"point",highlightSolution:!1};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`args => {
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
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`args => {
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
}`,...s.parameters?.docs?.source}}};const y=["InteractiveSvgExample","InteractiveP5Example"];export{s as InteractiveP5Example,a as InteractiveSvgExample,y as __namedExportsOrder,v as default};
//# sourceMappingURL=GraphCanvas.stories-RAVNinRS.js.map
