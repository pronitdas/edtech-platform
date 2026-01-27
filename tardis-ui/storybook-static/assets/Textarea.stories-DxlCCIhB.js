import{j as e}from"./iframe-Baxcka9q.js";import{T as r}from"./textarea-DbtTwMP2.js";import"./utils-CbZsw6Wr.js";const n={title:"UI/Textarea",component:r,tags:["autodocs"],argTypes:{placeholder:{control:"text",description:"Placeholder text"},disabled:{control:"boolean",description:"Whether the textarea is disabled"},error:{control:"boolean",description:"Whether the textarea is in an error state"},errorMessage:{control:"text",description:"Error message to display"},helperText:{control:"text",description:"Helper text to display"},rows:{control:"number",description:"Number of visible text lines"}}},s={args:{placeholder:"Type your message here...",rows:4}},a={args:{placeholder:"Type your message here...",helperText:"Maximum 500 characters",rows:4}},o={args:{placeholder:"Type your message here...",error:!0,errorMessage:"Message is required",rows:4}},t={args:{placeholder:"This textarea is disabled",disabled:!0,rows:4}},l={args:{placeholder:"Type your message here...",rows:8}},c={render:()=>e.jsxs("div",{className:"space-y-4",children:[e.jsx(r,{placeholder:"Default textarea",rows:4}),e.jsx(r,{placeholder:"With helper text",helperText:"This is a helper text",rows:4}),e.jsx(r,{placeholder:"With error",error:!0,errorMessage:"This field is required",rows:4}),e.jsx(r,{placeholder:"Disabled textarea",disabled:!0,rows:4})]})};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Type your message here...',
    rows: 4
  }
}`,...s.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Type your message here...',
    helperText: 'Maximum 500 characters',
    rows: 4
  }
}`,...a.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Type your message here...',
    error: true,
    errorMessage: 'Message is required',
    rows: 4
  }
}`,...o.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'This textarea is disabled',
    disabled: true,
    rows: 4
  }
}`,...t.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Type your message here...',
    rows: 8
  }
}`,...l.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <div className='space-y-4'>
      <Textarea placeholder='Default textarea' rows={4} />
      <Textarea placeholder='With helper text' helperText='This is a helper text' rows={4} />
      <Textarea placeholder='With error' error errorMessage='This field is required' rows={4} />
      <Textarea placeholder='Disabled textarea' disabled rows={4} />
    </div>
}`,...c.parameters?.docs?.source}}};const h=["Default","WithHelperText","WithError","Disabled","LargeTextarea","AllStates"];export{c as AllStates,s as Default,t as Disabled,l as LargeTextarea,o as WithError,a as WithHelperText,h as __namedExportsOrder,n as default};
//# sourceMappingURL=Textarea.stories-DxlCCIhB.js.map
