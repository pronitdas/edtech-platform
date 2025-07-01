import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import MathFormula from './MathFormula'

afterEach(cleanup)

describe('MathFormula Component', () => {
  it('renders a valid LaTeX formula', () => {
    const { container } = render(<MathFormula formula='\(E=mc^2\)' />)
    expect(container.firstChild).not.toBeEmptyDOMElement()
  })

  it('displays an error message for an invalid LaTeX formula', () => {
    const { container } = render(<MathFormula formula='\\(E=mc^\\)' />)
    const element = container.querySelector('.katex-error')
    expect(element).toBeInTheDocument()
  })
})
