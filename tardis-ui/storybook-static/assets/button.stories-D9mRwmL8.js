import{j as r}from"./jsx-runtime-D_zvdyIk.js";import{B as Dr}from"./button-eFm21kA6.js";import"./index-oxIuDU2I.js";import"./_commonjsHelpers-CqkleIqs.js";import"./index-BABKXdJD.js";import"./utils-Ba4dZznC.js";const Pr={title:"UI/Button",component:Dr,parameters:{layout:"centered",docs:{description:{component:`
## Button Component

The Button component is used to trigger actions or events.

### Usage

\`\`\`jsx
import { Button } from '@/components/ui/button';

function MyComponent() {
  return <Button variant="primary">Click Me</Button>;
}
\`\`\`

### Accessibility
- Uses native button element for keyboard navigation
- Maintains minimum contrast ratio of 4.5:1
- Includes focus styles
        `}}},tags:["autodocs"],argTypes:{variant:{control:"select",options:["primary","secondary","tertiary","danger","ghost","link"],description:"The visual style of the button",table:{type:{summary:"string"},defaultValue:{summary:"primary"}}},size:{control:"select",options:["sm","md","lg"],description:"The size of the button",table:{type:{summary:"string"},defaultValue:{summary:"md"}}},fullWidth:{control:"boolean",description:"Whether the button should take up the full width of its container",table:{type:{summary:"boolean"},defaultValue:{summary:"false"}}},isLoading:{control:"boolean",description:"Whether the button is in a loading state",table:{type:{summary:"boolean"},defaultValue:{summary:"false"}}},disabled:{control:"boolean",description:"Whether the button is disabled",table:{type:{summary:"boolean"},defaultValue:{summary:"false"}}},onClick:{action:"clicked"}}},t={args:{variant:"primary",children:"Primary Button",size:"md"}},e={args:{variant:"secondary",children:"Secondary Button",size:"md"}},n={args:{variant:"tertiary",children:"Tertiary Button",size:"md"}},s={args:{variant:"danger",children:"Danger Button",size:"md"}},a={args:{variant:"ghost",children:"Ghost Button",size:"md"}},o={args:{variant:"link",children:"Link Button",size:"md"}},i={args:{variant:"primary",children:"Small Button",size:"sm"}},c={args:{variant:"primary",children:"Medium Button",size:"md"}},d={args:{variant:"primary",children:"Large Button",size:"lg"}},m={args:{variant:"primary",children:"Loading Button",size:"md",isLoading:!0}},p={args:{variant:"primary",children:"Full Width Button",size:"md",fullWidth:!0}},u={args:{variant:"primary",children:"Disabled Button",size:"md",disabled:!0}},l={args:{variant:"primary",children:"Button with Icon",size:"md",leftIcon:r.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[r.jsx("circle",{cx:"12",cy:"12",r:"10"}),r.jsx("path",{d:"m8 12 4 4"}),r.jsx("path",{d:"m8 12 4-4"}),r.jsx("path",{d:"m16 12h-8"})]})}},h={args:{variant:"primary",children:"Button with Icon",size:"md",rightIcon:r.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[r.jsx("circle",{cx:"12",cy:"12",r:"10"}),r.jsx("path",{d:"m12 8 4 4-4 4"}),r.jsx("path",{d:"m8 12h8"})]})}};var g,y,v,b,f;t.parameters={...t.parameters,docs:{...(g=t.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Primary Button',
    size: 'md'
  }
}`,...(v=(y=t.parameters)==null?void 0:y.docs)==null?void 0:v.source},description:{story:"The primary button is used for the main action in a section or form.",...(f=(b=t.parameters)==null?void 0:b.docs)==null?void 0:f.description}}};var B,w,z,k,L;e.parameters={...e.parameters,docs:{...(B=e.parameters)==null?void 0:B.docs,source:{originalSource:`{
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
    size: 'md'
  }
}`,...(z=(w=e.parameters)==null?void 0:w.docs)==null?void 0:z.source},description:{story:"The secondary button is used for secondary actions.",...(L=(k=e.parameters)==null?void 0:k.docs)==null?void 0:L.description}}};var x,S,W,j,I;n.parameters={...n.parameters,docs:{...(x=n.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    variant: 'tertiary',
    children: 'Tertiary Button',
    size: 'md'
  }
}`,...(W=(S=n.parameters)==null?void 0:S.docs)==null?void 0:W.source},description:{story:"The tertiary button is used for less important actions.",...(I=(j=n.parameters)==null?void 0:j.docs)==null?void 0:I.description}}};var T,D,C,M,F;s.parameters={...s.parameters,docs:{...(T=s.parameters)==null?void 0:T.docs,source:{originalSource:`{
  args: {
    variant: 'danger',
    children: 'Danger Button',
    size: 'md'
  }
}`,...(C=(D=s.parameters)==null?void 0:D.docs)==null?void 0:C.source},description:{story:"The danger button is used for destructive actions.",...(F=(M=s.parameters)==null?void 0:M.docs)==null?void 0:F.description}}};var U,V,G,P,R;a.parameters={...a.parameters,docs:{...(U=a.parameters)==null?void 0:U.docs,source:{originalSource:`{
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
    size: 'md'
  }
}`,...(G=(V=a.parameters)==null?void 0:V.docs)==null?void 0:G.source},description:{story:"The ghost button is used for the least important actions.",...(R=(P=a.parameters)==null?void 0:P.docs)==null?void 0:R.description}}};var E,_,A,O,q;o.parameters={...o.parameters,docs:{...(E=o.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    variant: 'link',
    children: 'Link Button',
    size: 'md'
  }
}`,...(A=(_=o.parameters)==null?void 0:_.docs)==null?void 0:A.source},description:{story:"The link button is used for navigation.",...(q=(O=o.parameters)==null?void 0:O.docs)==null?void 0:q.description}}};var H,J,K,N,Q;i.parameters={...i.parameters,docs:{...(H=i.parameters)==null?void 0:H.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Small Button',
    size: 'sm'
  }
}`,...(K=(J=i.parameters)==null?void 0:J.docs)==null?void 0:K.source},description:{story:"Small size button for compact UIs.",...(Q=(N=i.parameters)==null?void 0:N.docs)==null?void 0:Q.description}}};var X,Y,Z,$,rr;c.parameters={...c.parameters,docs:{...(X=c.parameters)==null?void 0:X.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Medium Button',
    size: 'md'
  }
}`,...(Z=(Y=c.parameters)==null?void 0:Y.docs)==null?void 0:Z.source},description:{story:"Medium size button for standard UIs.",...(rr=($=c.parameters)==null?void 0:$.docs)==null?void 0:rr.description}}};var tr,er,nr,sr,ar;d.parameters={...d.parameters,docs:{...(tr=d.parameters)==null?void 0:tr.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Large Button',
    size: 'lg'
  }
}`,...(nr=(er=d.parameters)==null?void 0:er.docs)==null?void 0:nr.source},description:{story:"Large size button for prominent actions.",...(ar=(sr=d.parameters)==null?void 0:sr.docs)==null?void 0:ar.description}}};var or,ir,cr,dr,mr;m.parameters={...m.parameters,docs:{...(or=m.parameters)==null?void 0:or.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Loading Button',
    size: 'md',
    isLoading: true
  }
}`,...(cr=(ir=m.parameters)==null?void 0:ir.docs)==null?void 0:cr.source},description:{story:"Loading state button shows a spinner.",...(mr=(dr=m.parameters)==null?void 0:dr.docs)==null?void 0:mr.description}}};var pr,ur,lr,hr,gr;p.parameters={...p.parameters,docs:{...(pr=p.parameters)==null?void 0:pr.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Full Width Button',
    size: 'md',
    fullWidth: true
  }
}`,...(lr=(ur=p.parameters)==null?void 0:ur.docs)==null?void 0:lr.source},description:{story:"Full width button that takes up the entire container width.",...(gr=(hr=p.parameters)==null?void 0:hr.docs)==null?void 0:gr.description}}};var yr,vr,br,fr,Br;u.parameters={...u.parameters,docs:{...(yr=u.parameters)==null?void 0:yr.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Disabled Button',
    size: 'md',
    disabled: true
  }
}`,...(br=(vr=u.parameters)==null?void 0:vr.docs)==null?void 0:br.source},description:{story:"Disabled button cannot be interacted with.",...(Br=(fr=u.parameters)==null?void 0:fr.docs)==null?void 0:Br.description}}};var wr,zr,kr,Lr,xr;l.parameters={...l.parameters,docs:{...(wr=l.parameters)==null?void 0:wr.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Button with Icon',
    size: 'md',
    leftIcon: <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
        <circle cx='12' cy='12' r='10' />
        <path d='m8 12 4 4' />
        <path d='m8 12 4-4' />
        <path d='m16 12h-8' />
      </svg>
  }
}`,...(kr=(zr=l.parameters)==null?void 0:zr.docs)==null?void 0:kr.source},description:{story:"Button with an icon on the left.",...(xr=(Lr=l.parameters)==null?void 0:Lr.docs)==null?void 0:xr.description}}};var Sr,Wr,jr,Ir,Tr;h.parameters={...h.parameters,docs:{...(Sr=h.parameters)==null?void 0:Sr.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Button with Icon',
    size: 'md',
    rightIcon: <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
        <circle cx='12' cy='12' r='10' />
        <path d='m12 8 4 4-4 4' />
        <path d='m8 12h8' />
      </svg>
  }
}`,...(jr=(Wr=h.parameters)==null?void 0:Wr.docs)==null?void 0:jr.source},description:{story:"Button with an icon on the right.",...(Tr=(Ir=h.parameters)==null?void 0:Ir.docs)==null?void 0:Tr.description}}};const Rr=["Primary","Secondary","Tertiary","Danger","Ghost","Link","Small","Medium","Large","Loading","FullWidth","Disabled","WithLeftIcon","WithRightIcon"];export{s as Danger,u as Disabled,p as FullWidth,a as Ghost,d as Large,o as Link,m as Loading,c as Medium,t as Primary,e as Secondary,i as Small,n as Tertiary,l as WithLeftIcon,h as WithRightIcon,Rr as __namedExportsOrder,Pr as default};
//# sourceMappingURL=button.stories-D9mRwmL8.js.map
