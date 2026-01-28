import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{T as r}from"./textarea-BqieMxdA.js";import"./index-oxIuDU2I.js";import"./_commonjsHelpers-CqkleIqs.js";import"./utils-Ba4dZznC.js";const N={title:"UI/Textarea",component:r,tags:["autodocs"],argTypes:{placeholder:{control:"text",description:"Placeholder text"},disabled:{control:"boolean",description:"Whether the textarea is disabled"},error:{control:"boolean",description:"Whether the textarea is in an error state"},errorMessage:{control:"text",description:"Error message to display"},helperText:{control:"text",description:"Helper text to display"},rows:{control:"number",description:"Number of visible text lines"}}},s={args:{placeholder:"Type your message here...",rows:4}},a={args:{placeholder:"Type your message here...",helperText:"Maximum 500 characters",rows:4}},o={args:{placeholder:"Type your message here...",error:!0,errorMessage:"Message is required",rows:4}},t={args:{placeholder:"This textarea is disabled",disabled:!0,rows:4}},l={args:{placeholder:"Type your message here...",rows:8}},c={render:()=>e.jsxs("div",{className:"space-y-4",children:[e.jsx(r,{placeholder:"Default textarea",rows:4}),e.jsx(r,{placeholder:"With helper text",helperText:"This is a helper text",rows:4}),e.jsx(r,{placeholder:"With error",error:!0,errorMessage:"This field is required",rows:4}),e.jsx(r,{placeholder:"Disabled textarea",disabled:!0,rows:4})]})};var i,p,d;s.parameters={...s.parameters,docs:{...(i=s.parameters)==null?void 0:i.docs,source:{originalSource:`{
  args: {
    placeholder: 'Type your message here...',
    rows: 4
  }
}`,...(d=(p=s.parameters)==null?void 0:p.docs)==null?void 0:d.source}}};var n,h,m;a.parameters={...a.parameters,docs:{...(n=a.parameters)==null?void 0:n.docs,source:{originalSource:`{
  args: {
    placeholder: 'Type your message here...',
    helperText: 'Maximum 500 characters',
    rows: 4
  }
}`,...(m=(h=a.parameters)==null?void 0:h.docs)==null?void 0:m.source}}};var u,x,g;o.parameters={...o.parameters,docs:{...(u=o.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    placeholder: 'Type your message here...',
    error: true,
    errorMessage: 'Message is required',
    rows: 4
  }
}`,...(g=(x=o.parameters)==null?void 0:x.docs)==null?void 0:g.source}}};var T,y,w;t.parameters={...t.parameters,docs:{...(T=t.parameters)==null?void 0:T.docs,source:{originalSource:`{
  args: {
    placeholder: 'This textarea is disabled',
    disabled: true,
    rows: 4
  }
}`,...(w=(y=t.parameters)==null?void 0:y.docs)==null?void 0:w.source}}};var b,f,W;l.parameters={...l.parameters,docs:{...(b=l.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    placeholder: 'Type your message here...',
    rows: 8
  }
}`,...(W=(f=l.parameters)==null?void 0:f.docs)==null?void 0:W.source}}};var M,D,S;c.parameters={...c.parameters,docs:{...(M=c.parameters)==null?void 0:M.docs,source:{originalSource:`{
  render: () => <div className='space-y-4'>
      <Textarea placeholder='Default textarea' rows={4} />
      <Textarea placeholder='With helper text' helperText='This is a helper text' rows={4} />
      <Textarea placeholder='With error' error errorMessage='This field is required' rows={4} />
      <Textarea placeholder='Disabled textarea' disabled rows={4} />
    </div>
}`,...(S=(D=c.parameters)==null?void 0:D.docs)==null?void 0:S.source}}};const A=["Default","WithHelperText","WithError","Disabled","LargeTextarea","AllStates"];export{c as AllStates,s as Default,t as Disabled,l as LargeTextarea,o as WithError,a as WithHelperText,A as __namedExportsOrder,N as default};
//# sourceMappingURL=Textarea.stories-CaSVr1OA.js.map
