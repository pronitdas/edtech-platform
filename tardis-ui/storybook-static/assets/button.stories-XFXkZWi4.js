import{j as r}from"./iframe-Baxcka9q.js";import{B as g}from"./button-DXArZr2y.js";import"./index-Dg-g8a3P.js";import"./utils-CbZsw6Wr.js";const B={title:"UI/Button",component:g,parameters:{layout:"centered",docs:{description:{component:`
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
        `}}},tags:["autodocs"],argTypes:{variant:{control:"select",options:["primary","secondary","tertiary","danger","ghost","link"],description:"The visual style of the button",table:{type:{summary:"string"},defaultValue:{summary:"primary"}}},size:{control:"select",options:["sm","md","lg"],description:"The size of the button",table:{type:{summary:"string"},defaultValue:{summary:"md"}}},fullWidth:{control:"boolean",description:"Whether the button should take up the full width of its container",table:{type:{summary:"boolean"},defaultValue:{summary:"false"}}},isLoading:{control:"boolean",description:"Whether the button is in a loading state",table:{type:{summary:"boolean"},defaultValue:{summary:"false"}}},disabled:{control:"boolean",description:"Whether the button is disabled",table:{type:{summary:"boolean"},defaultValue:{summary:"false"}}},onClick:{action:"clicked"}}},e={args:{variant:"primary",children:"Primary Button",size:"md"}},t={args:{variant:"secondary",children:"Secondary Button",size:"md"}},n={args:{variant:"tertiary",children:"Tertiary Button",size:"md"}},s={args:{variant:"danger",children:"Danger Button",size:"md"}},a={args:{variant:"ghost",children:"Ghost Button",size:"md"}},o={args:{variant:"link",children:"Link Button",size:"md"}},i={args:{variant:"primary",children:"Small Button",size:"sm"}},c={args:{variant:"primary",children:"Medium Button",size:"md"}},d={args:{variant:"primary",children:"Large Button",size:"lg"}},m={args:{variant:"primary",children:"Loading Button",size:"md",isLoading:!0}},p={args:{variant:"primary",children:"Full Width Button",size:"md",fullWidth:!0}},u={args:{variant:"primary",children:"Disabled Button",size:"md",disabled:!0}},l={args:{variant:"primary",children:"Button with Icon",size:"md",leftIcon:r.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[r.jsx("circle",{cx:"12",cy:"12",r:"10"}),r.jsx("path",{d:"m8 12 4 4"}),r.jsx("path",{d:"m8 12 4-4"}),r.jsx("path",{d:"m16 12h-8"})]})}},h={args:{variant:"primary",children:"Button with Icon",size:"md",rightIcon:r.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[r.jsx("circle",{cx:"12",cy:"12",r:"10"}),r.jsx("path",{d:"m12 8 4 4-4 4"}),r.jsx("path",{d:"m8 12h8"})]})}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Primary Button',
    size: 'md'
  }
}`,...e.parameters?.docs?.source},description:{story:"The primary button is used for the main action in a section or form.",...e.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
    size: 'md'
  }
}`,...t.parameters?.docs?.source},description:{story:"The secondary button is used for secondary actions.",...t.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'tertiary',
    children: 'Tertiary Button',
    size: 'md'
  }
}`,...n.parameters?.docs?.source},description:{story:"The tertiary button is used for less important actions.",...n.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'danger',
    children: 'Danger Button',
    size: 'md'
  }
}`,...s.parameters?.docs?.source},description:{story:"The danger button is used for destructive actions.",...s.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
    size: 'md'
  }
}`,...a.parameters?.docs?.source},description:{story:"The ghost button is used for the least important actions.",...a.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'link',
    children: 'Link Button',
    size: 'md'
  }
}`,...o.parameters?.docs?.source},description:{story:"The link button is used for navigation.",...o.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Small Button',
    size: 'sm'
  }
}`,...i.parameters?.docs?.source},description:{story:"Small size button for compact UIs.",...i.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Medium Button',
    size: 'md'
  }
}`,...c.parameters?.docs?.source},description:{story:"Medium size button for standard UIs.",...c.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Large Button',
    size: 'lg'
  }
}`,...d.parameters?.docs?.source},description:{story:"Large size button for prominent actions.",...d.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Loading Button',
    size: 'md',
    isLoading: true
  }
}`,...m.parameters?.docs?.source},description:{story:"Loading state button shows a spinner.",...m.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Full Width Button',
    size: 'md',
    fullWidth: true
  }
}`,...p.parameters?.docs?.source},description:{story:"Full width button that takes up the entire container width.",...p.parameters?.docs?.description}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Disabled Button',
    size: 'md',
    disabled: true
  }
}`,...u.parameters?.docs?.source},description:{story:"Disabled button cannot be interacted with.",...u.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
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
}`,...l.parameters?.docs?.source},description:{story:"Button with an icon on the left.",...l.parameters?.docs?.description}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
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
}`,...h.parameters?.docs?.source},description:{story:"Button with an icon on the right.",...h.parameters?.docs?.description}}};const w=["Primary","Secondary","Tertiary","Danger","Ghost","Link","Small","Medium","Large","Loading","FullWidth","Disabled","WithLeftIcon","WithRightIcon"];export{s as Danger,u as Disabled,p as FullWidth,a as Ghost,d as Large,o as Link,m as Loading,c as Medium,e as Primary,t as Secondary,i as Small,n as Tertiary,l as WithLeftIcon,h as WithRightIcon,w as __namedExportsOrder,B as default};
//# sourceMappingURL=button.stories-XFXkZWi4.js.map
