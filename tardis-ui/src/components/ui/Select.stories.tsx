import type { Meta, StoryObj } from '@storybook/react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './select';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Whether the select is disabled'
    }
  }
};

export default meta;
type Story = StoryObj<typeof Select>;

const SelectDemo = ({ error, errorMessage, helperText, disabled }: any) => (
  <Select>
    <SelectTrigger
      error={error}
      errorMessage={errorMessage}
      helperText={helperText}
      disabled={disabled}
    >
      <SelectValue placeholder="Select a fruit" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectLabel>Fruits</SelectLabel>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
        <SelectItem value="grape">Grape</SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
);

export const Default: Story = {
  render: () => <SelectDemo />
};

export const WithHelperText: Story = {
  render: () => (
    <SelectDemo helperText="Choose your favorite fruit" />
  )
};

export const WithError: Story = {
  render: () => (
    <SelectDemo
      error={true}
      errorMessage="Please select a fruit"
    />
  )
};

export const Disabled: Story = {
  render: () => (
    <SelectDemo disabled={true} />
  )
};

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a food" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="orange">Orange</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Vegetables</SelectLabel>
          <SelectItem value="carrot">Carrot</SelectItem>
          <SelectItem value="broccoli">Broccoli</SelectItem>
          <SelectItem value="spinach">Spinach</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
};

export const AllStates: Story = {
  render: () => (
    <div className="space-y-4">
      <SelectDemo />
      <SelectDemo
        helperText="With helper text"
      />
      <SelectDemo
        error={true}
        errorMessage="With error message"
      />
      <SelectDemo disabled={true} />
    </div>
  )
}; 