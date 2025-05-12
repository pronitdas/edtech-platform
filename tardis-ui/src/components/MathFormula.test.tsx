import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import MathFormula from './MathFormula';

afterEach(cleanup);

describe('MathFormula Component', () => {
    it('renders a valid LaTeX formula', () => {
        render(<MathFormula formula="\\(E=mc^2\\)" />);
        const element = screen.getByText('E=mc^2');
        expect(element).toBeInTheDocument();
    });

    it('displays an error message for an invalid LaTeX formula', () => {
        render(<MathFormula formula="\\(E=mc^\\)" />);
        const element = screen.getByText('KaTeX parse error');
        expect(element).toBeInTheDocument();
    });
});