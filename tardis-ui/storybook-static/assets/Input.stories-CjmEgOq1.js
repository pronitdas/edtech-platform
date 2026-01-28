import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{I as r}from"./input-BW5vinc8.js";import{c as q}from"./createLucideIcon-DUWlDEBy.js";import{C as p}from"./circle-alert-CX6K2IxP.js";import"./index-oxIuDU2I.js";import"./_commonjsHelpers-CqkleIqs.js";import"./utils-Ba4dZznC.js";/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H=[["path",{d:"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7",key:"132q7q"}],["rect",{x:"2",y:"4",width:"20",height:"16",rx:"2",key:"izxlao"}]],P=q("mail",H);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R=[["path",{d:"m21 21-4.34-4.34",key:"14j7rj"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}]],L=q("search",R),J={title:"UI/Input",component:r,tags:["autodocs"],argTypes:{type:{control:"select",options:["text","email","password","number","search","tel","url"],description:"Type of the input field"},placeholder:{control:"text",description:"Placeholder text"},disabled:{control:"boolean",description:"Whether the input is disabled"},error:{control:"boolean",description:"Whether the input is in an error state"},errorMessage:{control:"text",description:"Error message to display"},helperText:{control:"text",description:"Helper text to display"}}},t={args:{type:"text",placeholder:"Enter text..."}},a={args:{type:"email",placeholder:"Enter your email",helperText:"We will never share your email"}},s={args:{type:"email",placeholder:"Enter your email",error:!0,errorMessage:"Please enter a valid email address"}},o={args:{type:"search",placeholder:"Search...",leftIcon:e.jsx(L,{className:"h-4 w-4"})}},l={args:{type:"text",placeholder:"Enter text...",rightIcon:e.jsx(p,{className:"h-4 w-4"})}},c={args:{type:"email",placeholder:"Enter your email",leftIcon:e.jsx(P,{className:"h-4 w-4"}),rightIcon:e.jsx(p,{className:"h-4 w-4"})}},n={args:{type:"text",placeholder:"Disabled input",disabled:!0}},i={render:()=>e.jsxs("div",{className:"space-y-4",children:[e.jsx(r,{placeholder:"Default input"}),e.jsx(r,{placeholder:"With helper text",helperText:"This is a helper text"}),e.jsx(r,{placeholder:"With error",error:!0,errorMessage:"This field is required"}),e.jsx(r,{placeholder:"With left icon",leftIcon:e.jsx(L,{className:"h-4 w-4"})}),e.jsx(r,{placeholder:"With right icon",rightIcon:e.jsx(p,{className:"h-4 w-4"})}),e.jsx(r,{placeholder:"Disabled input",disabled:!0})]})};var h,d,m;t.parameters={...t.parameters,docs:{...(h=t.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    type: 'text',
    placeholder: 'Enter text...'
  }
}`,...(m=(d=t.parameters)==null?void 0:d.docs)==null?void 0:m.source}}};var u,x,g;a.parameters={...a.parameters,docs:{...(u=a.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    type: 'email',
    placeholder: 'Enter your email',
    helperText: 'We will never share your email'
  }
}`,...(g=(x=a.parameters)==null?void 0:x.docs)==null?void 0:g.source}}};var y,I,f;s.parameters={...s.parameters,docs:{...(y=s.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    type: 'email',
    placeholder: 'Enter your email',
    error: true,
    errorMessage: 'Please enter a valid email address'
  }
}`,...(f=(I=s.parameters)==null?void 0:I.docs)==null?void 0:f.source}}};var W,j,w;o.parameters={...o.parameters,docs:{...(W=o.parameters)==null?void 0:W.docs,source:{originalSource:`{
  args: {
    type: 'search',
    placeholder: 'Search...',
    leftIcon: <Search className='h-4 w-4' />
  }
}`,...(w=(j=o.parameters)==null?void 0:j.docs)==null?void 0:w.source}}};var N,b,E;l.parameters={...l.parameters,docs:{...(N=l.parameters)==null?void 0:N.docs,source:{originalSource:`{
  args: {
    type: 'text',
    placeholder: 'Enter text...',
    rightIcon: <AlertCircle className='h-4 w-4' />
  }
}`,...(E=(b=l.parameters)==null?void 0:b.docs)==null?void 0:E.source}}};var S,T,D;c.parameters={...c.parameters,docs:{...(S=c.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    type: 'email',
    placeholder: 'Enter your email',
    leftIcon: <Mail className='h-4 w-4' />,
    rightIcon: <AlertCircle className='h-4 w-4' />
  }
}`,...(D=(T=c.parameters)==null?void 0:T.docs)==null?void 0:D.source}}};var v,M,A;n.parameters={...n.parameters,docs:{...(v=n.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    type: 'text',
    placeholder: 'Disabled input',
    disabled: true
  }
}`,...(A=(M=n.parameters)==null?void 0:M.docs)==null?void 0:A.source}}};var _,C,k;i.parameters={...i.parameters,docs:{...(_=i.parameters)==null?void 0:_.docs,source:{originalSource:`{
  render: () => <div className='space-y-4'>
      <Input placeholder='Default input' />
      <Input placeholder='With helper text' helperText='This is a helper text' />
      <Input placeholder='With error' error errorMessage='This field is required' />
      <Input placeholder='With left icon' leftIcon={<Search className='h-4 w-4' />} />
      <Input placeholder='With right icon' rightIcon={<AlertCircle className='h-4 w-4' />} />
      <Input placeholder='Disabled input' disabled />
    </div>
}`,...(k=(C=i.parameters)==null?void 0:C.docs)==null?void 0:k.source}}};const K=["Default","WithHelperText","WithError","WithLeftIcon","WithRightIcon","WithBothIcons","Disabled","AllStates"];export{i as AllStates,t as Default,n as Disabled,c as WithBothIcons,s as WithError,a as WithHelperText,o as WithLeftIcon,l as WithRightIcon,K as __namedExportsOrder,J as default};
//# sourceMappingURL=Input.stories-CjmEgOq1.js.map
