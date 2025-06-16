import React, { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface MathFormulaProps {
  formula: string
}

const MathFormula: React.FC<MathFormulaProps> = ({ formula }) => {
  const formulaEl = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (formulaEl.current) {
      try {
        katex.render(formula, formulaEl.current, {
          displayMode: true,
          throwOnError: false,
        })
      } catch (error) {
        console.error('KaTeX render error:', error)
        formulaEl.current.textContent = `Error rendering formula: ${error}`
      }
    }
  }, [formula])

  return <span ref={formulaEl} aria-label={formula} title={formula}></span>
}

export default MathFormula
