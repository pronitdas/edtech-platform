import{j as e}from"./iframe-Baxcka9q.js";import{I as r}from"./input-7Y_YHb2v.js";import{c as h}from"./createLucideIcon-BhHhnBlm.js";import{C as p}from"./circle-alert-mwexni2a.js";import"./utils-CbZsw6Wr.js";/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=[["path",{d:"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7",key:"132q7q"}],["rect",{x:"2",y:"4",width:"20",height:"16",rx:"2",key:"izxlao"}]],u=h("mail",m);/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=[["path",{d:"m21 21-4.34-4.34",key:"14j7rj"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}]],d=h("search",x),j={title:"UI/Input",component:r,tags:["autodocs"],argTypes:{type:{control:"select",options:["text","email","password","number","search","tel","url"],description:"Type of the input field"},placeholder:{control:"text",description:"Placeholder text"},disabled:{control:"boolean",description:"Whether the input is disabled"},error:{control:"boolean",description:"Whether the input is in an error state"},errorMessage:{control:"text",description:"Error message to display"},helperText:{control:"text",description:"Helper text to display"}}},t={args:{type:"text",placeholder:"Enter text..."}},a={args:{type:"email",placeholder:"Enter your email",helperText:"We will never share your email"}},s={args:{type:"email",placeholder:"Enter your email",error:!0,errorMessage:"Please enter a valid email address"}},o={args:{type:"search",placeholder:"Search...",leftIcon:e.jsx(d,{className:"h-4 w-4"})}},l={args:{type:"text",placeholder:"Enter text...",rightIcon:e.jsx(p,{className:"h-4 w-4"})}},c={args:{type:"email",placeholder:"Enter your email",leftIcon:e.jsx(u,{className:"h-4 w-4"}),rightIcon:e.jsx(p,{className:"h-4 w-4"})}},n={args:{type:"text",placeholder:"Disabled input",disabled:!0}},i={render:()=>e.jsxs("div",{className:"space-y-4",children:[e.jsx(r,{placeholder:"Default input"}),e.jsx(r,{placeholder:"With helper text",helperText:"This is a helper text"}),e.jsx(r,{placeholder:"With error",error:!0,errorMessage:"This field is required"}),e.jsx(r,{placeholder:"With left icon",leftIcon:e.jsx(d,{className:"h-4 w-4"})}),e.jsx(r,{placeholder:"With right icon",rightIcon:e.jsx(p,{className:"h-4 w-4"})}),e.jsx(r,{placeholder:"Disabled input",disabled:!0})]})};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'text',
    placeholder: 'Enter text...'
  }
}`,...t.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'email',
    placeholder: 'Enter your email',
    helperText: 'We will never share your email'
  }
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'email',
    placeholder: 'Enter your email',
    error: true,
    errorMessage: 'Please enter a valid email address'
  }
}`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'search',
    placeholder: 'Search...',
    leftIcon: <Search className='h-4 w-4' />
  }
}`,...o.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'text',
    placeholder: 'Enter text...',
    rightIcon: <AlertCircle className='h-4 w-4' />
  }
}`,...l.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'email',
    placeholder: 'Enter your email',
    leftIcon: <Mail className='h-4 w-4' />,
    rightIcon: <AlertCircle className='h-4 w-4' />
  }
}`,...c.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'text',
    placeholder: 'Disabled input',
    disabled: true
  }
}`,...n.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <div className='space-y-4'>
      <Input placeholder='Default input' />
      <Input placeholder='With helper text' helperText='This is a helper text' />
      <Input placeholder='With error' error errorMessage='This field is required' />
      <Input placeholder='With left icon' leftIcon={<Search className='h-4 w-4' />} />
      <Input placeholder='With right icon' rightIcon={<AlertCircle className='h-4 w-4' />} />
      <Input placeholder='Disabled input' disabled />
    </div>
}`,...i.parameters?.docs?.source}}};const w=["Default","WithHelperText","WithError","WithLeftIcon","WithRightIcon","WithBothIcons","Disabled","AllStates"];export{i as AllStates,t as Default,n as Disabled,c as WithBothIcons,s as WithError,a as WithHelperText,o as WithLeftIcon,l as WithRightIcon,w as __namedExportsOrder,j as default};
//# sourceMappingURL=Input.stories-CkrrPcIi.js.map
