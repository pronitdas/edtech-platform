import React, { useEffect, useRef, useState } from 'react'
// import * as math from 'mathjs' // TODO: Install mathjs or use native Math

const DividendGrowthCalculator = () => {
  const [initialDividend, setInitialDividend] = useState(1.0)
  const [growthRate, setGrowthRate] = useState(7)
  const [years, setYears] = useState(10)
  const canvasRef = useRef<{ remove(): void; updateVis?(): void } | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only run this effect when the component mounts
    if (typeof window !== 'undefined') {
      // Load MathJax script
      const script = document.createElement('script')
      script.src =
        'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML'
      script.async = true
      document.body.appendChild(script)

      script.onload = () => {
        // Initialize MathJax after it's loaded
        if ((window as any).MathJax) {
          (window as any).MathJax.Hub.Queue(['Typeset', (window as any).MathJax.Hub])
        }
      }

      return () => {
        // Clean up the script when component unmounts
        document.body.removeChild(script)
      }
    }
  }, [])

  useEffect(() => {
    if (!canvasContainerRef.current) return

    const sketch = (p: any) => { // TODO: Install p5.js types
      const paddingLeft = 80
      const paddingRight = 50
      const paddingTop = 50
      const paddingBottom = 50

      p.setup = function () {
        const canvas = p.createCanvas(800, 400)
        canvas.parent(canvasContainerRef.current)
        updateVisualization()
      }

      function updateVisualization() {
        // Set a dark background for the canvas
        p.background(40)

        // Calculate dividend values
        const values = []
        for (let i = 0; i <= years; i++) {
          values.push(initialDividend * Math.pow(1 + growthRate / 100, i))
        }

        // Find max value for scaling
        const maxValue = Math.max(...values)

        // Draw axes with a light color for visibility
        p.stroke(220)
        p.strokeWeight(1)
        p.line(
          paddingLeft,
          p.height - paddingBottom,
          p.width - paddingRight,
          p.height - paddingBottom
        ) // x-axis
        p.line(paddingLeft, p.height - paddingBottom, paddingLeft, paddingTop) // y-axis

        // Draw axis labels
        p.textAlign(p.CENTER, p.CENTER)
        p.textSize(12)
        p.fill(220)

        // X-axis labels
        for (let i = 0; i <= years; i += Math.ceil(years / 10)) {
          const x = p.map(i, 0, years, paddingLeft, p.width - paddingRight)
          p.line(x, p.height - paddingBottom, x, p.height - paddingBottom + 5)
          p.text(i, x, p.height - paddingBottom + 20)
        }
        p.text('Years', p.width / 2, p.height - 10)

        // Y-axis labels
        const yStep = maxValue / 5
        for (let i = 0; i <= 5; i++) {
          const y = p.map(
            i * yStep,
            0,
            maxValue,
            p.height - paddingBottom,
            paddingTop
          )
          p.line(paddingLeft - 5, y, paddingLeft, y)
          p.textAlign(p.RIGHT, p.CENTER)
          p.text('$' + (i * yStep).toFixed(2), paddingLeft - 10, y)
        }

        // Y-axis title
        p.push()
        p.translate(25, p.height / 2)
        p.rotate(-p.HALF_PI)
        p.text('Dividend Amount ($)', 0, 0)
        p.pop()

        // Draw dividend growth curve in blue
        p.stroke(0, 100, 200)
        p.strokeWeight(2)
        p.noFill()
        p.beginShape()
        for (let i = 0; i <= years; i++) {
          const x = p.map(i, 0, years, paddingLeft, p.width - paddingRight)
          const y = p.map(
            values[i],
            0,
            maxValue,
            p.height - paddingBottom,
            paddingTop
          )
          p.vertex(x, y)

          // Add points at each year
          p.push()
          p.fill(0, 100, 200)
          p.ellipse(x, y, 6, 6)
          p.pop()
        }
        p.endShape()
      }

      // Make updateVisualization available to React component
      p.updateVis = updateVisualization
    }

    // TODO: Install p5.js properly with: npm install p5 @types/p5
    // For now, check if p5 is available on window
    interface P5Constructor {
      new (sketch: (p: unknown) => void): { remove(): void; updateVis?(): void }
    }
    
    const p5 = (window as any).p5 as P5Constructor | undefined
    if (p5) {
      const instance = new p5(sketch)
      canvasRef.current = instance
    }

    return () => {
      // Clean up p5 instance when component unmounts
      if (canvasRef.current) {
        canvasRef.current.remove()
      }
    }
  }, [])

  // Update visualization when inputs change
  useEffect(() => {
    if (canvasRef.current?.updateVis) {
      canvasRef.current.updateVis()
    }
  }, [initialDividend, growthRate, years])

  return (
    <div className='mx-auto max-w-6xl bg-gray-900 p-4 text-gray-200'>
      <div className='rounded-lg bg-gray-800 p-4 shadow-md'>
        <h1 className='mb-4 text-2xl font-bold'>
          Understanding Dividend Growth Rate
        </h1>

        <div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
          <div className='rounded bg-gray-700 p-3'>
            <label htmlFor='initialDividend' className='mb-1 block font-bold'>
              Initial Annual Dividend ($):
            </label>
            <input
              type='number'
              id='initialDividend'
              value={initialDividend}
              onChange={e => setInitialDividend(parseFloat(e.target.value))}
              min='0.01'
              step='0.01'
              className='w-full rounded border border-gray-600 bg-gray-700 p-2 text-gray-200'
            />
          </div>
          <div className='rounded bg-gray-700 p-3'>
            <label htmlFor='growthRate' className='mb-1 block font-bold'>
              Growth Rate (%):
            </label>
            <input
              type='number'
              id='growthRate'
              value={growthRate}
              onChange={e => setGrowthRate(parseFloat(e.target.value))}
              min='0'
              max='30'
              step='0.1'
              className='w-full rounded border border-gray-600 bg-gray-700 p-2 text-gray-200'
            />
          </div>
          <div className='rounded bg-gray-700 p-3'>
            <label htmlFor='years' className='mb-1 block font-bold'>
              Time Period (Years):
            </label>
            <input
              type='number'
              id='years'
              value={years}
              onChange={e => setYears(parseInt(e.target.value))}
              min='1'
              max='30'
              step='1'
              className='w-full rounded border border-gray-600 bg-gray-700 p-2 text-gray-200'
            />
          </div>
        </div>

        <div
          ref={canvasContainerRef}
          className='mx-auto my-4 h-96 w-full max-w-3xl overflow-hidden rounded border border-gray-600'
        ></div>

        <div className='mt-4 rounded bg-gray-700 p-4'>
          <h2 className='mb-2 text-xl font-bold'>Formula</h2>
          <div id='formula'>
            {`\\[D_n = D_0(1 + g)^n\\]
            where:
            \\[D_n = \\text{Dividend in year n}\\]
            \\[D_0 = \\text{Initial dividend}\\]
            \\[g = \\text{Growth rate (decimal)}\\]
            \\[n = \\text{Number of years}\\]`}
          </div>

          <h2 className='mb-2 mt-4 text-xl font-bold'>Key Concepts</h2>
          <p>
            The Dividend Growth Rate represents the annual rate at which a
            company increases its dividend payments. This is important because:
          </p>
          <ul className='mt-2 list-disc pl-6'>
            <li>
              It helps investors project future income from their investments
            </li>
            <li>
              It can indicate a company's financial health and growth prospects
            </li>
            <li>
              It's used in various valuation models, including the Dividend
              Discount Model
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default DividendGrowthCalculator
