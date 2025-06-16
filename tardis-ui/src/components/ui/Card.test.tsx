import React from 'react'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { Card } from './Card'

describe('Card', () => {
  it('renders children content', () => {
    render(<Card>Test Content</Card>)
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders header when provided', () => {
    render(<Card header='Test Header'>Content</Card>)
    expect(screen.getByText('Test Header')).toBeInTheDocument()
  })

  it('renders footer when provided', () => {
    render(<Card footer='Test Footer'>Content</Card>)
    expect(screen.getByText('Test Footer')).toBeInTheDocument()
  })

  it('applies correct variant styles', () => {
    const { rerender } = render(<Card variant='default'>Content</Card>)
    expect(screen.getByText('Content').parentElement).toHaveClass('bg-gray-50')

    rerender(<Card variant='elevated'>Content</Card>)
    expect(screen.getByText('Content').parentElement).toHaveClass('bg-white')

    rerender(<Card variant='outlined'>Content</Card>)
    expect(screen.getByText('Content').parentElement).toHaveClass('border')
  })

  it('applies full height style when fullHeight is true', () => {
    render(<Card fullHeight>Content</Card>)
    expect(screen.getByText('Content').parentElement).toHaveClass('h-full')
  })

  it('merges custom className with default styles', () => {
    render(<Card className='custom-class'>Content</Card>)
    const card = screen.getByText('Content').parentElement
    expect(card).toHaveClass('custom-class')
    expect(card).toHaveClass('rounded-lg') // default style
  })

  it('forwards additional HTML attributes', () => {
    render(<Card data-testid='test-card'>Content</Card>)
    expect(screen.getByTestId('test-card')).toBeInTheDocument()
  })

  it('renders complex header and footer content', () => {
    const ComplexHeader = () => <div>Complex Header</div>
    const ComplexFooter = () => <div>Complex Footer</div>

    render(
      <Card header={<ComplexHeader />} footer={<ComplexFooter />}>
        Content
      </Card>
    )

    expect(screen.getByText('Complex Header')).toBeInTheDocument()
    expect(screen.getByText('Complex Footer')).toBeInTheDocument()
  })
})
