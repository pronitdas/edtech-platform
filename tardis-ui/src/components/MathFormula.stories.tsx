import React from 'react'
import { StoryFn, Meta } from '@storybook/react'
import MathFormula from './MathFormula'

export default {
  title: 'Components/MathFormula',
  component: MathFormula,
} as Meta

const Template: StoryFn<React.ComponentProps<typeof MathFormula>> = args => (
  <MathFormula {...args} />
)

export const SimpleEquation = Template.bind({})
SimpleEquation.args = {
  formula: 'E=mc^2',
}

export const Fraction = Template.bind({})
Fraction.args = {
  formula: '\\frac{1}{2}',
}

export const Integral = Template.bind({})
Integral.args = {
  formula: '\\int_{a}^{b} x^2 dx',
}

export const Matrix = Template.bind({})
Matrix.args = {
  formula: '\\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}',
}
