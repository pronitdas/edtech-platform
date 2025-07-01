import React, { useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import p5 from 'p5'

const DividendGrowthCalculator = () => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const p5Instance = useRef<p5 | null>(null)

  const [values, setValues] = React.useState({
    dividend: 2,
    returnRate: 10,
    growthRate: 5,
    stockValue: 40.0,
  })

  useEffect(() => {
    if (canvasRef.current && !p5Instance.current) {
      const sketch = (p: p5) => {
        const canvasW = 400
        const canvasH = 300
        const margin = 40
        const years = 10

        p.setup = () => {
          p.createCanvas(canvasW, canvasH)
        }

        p.draw = () => {
          p.background(40)
          drawGraph(p)
        }

        const drawGraph = (p: p5) => {
          // Draw axes
          p.stroke(200)
          p.line(margin, canvasH - margin, canvasW - margin, canvasH - margin)
          p.line(margin, canvasH - margin, margin, margin)

          // Calculate points for dividend growth
          const points = []
          let maxDividend = values.dividend
          const growthRate = values.growthRate / 100

          for (let year = 0; year <= years; year++) {
            const currentDividend =
              values.dividend * Math.pow(1 + growthRate, year)
            maxDividend = Math.max(maxDividend, currentDividend)
            points.push({ x: year, y: currentDividend })
          }

          // Draw line and points
          p.stroke(0, 120, 255)
          p.strokeWeight(2)
          p.noFill()
          p.beginShape()
          points.forEach(point => {
            const x = p.map(point.x, 0, years, margin, canvasW - margin)
            const y = p.map(
              point.y,
              0,
              maxDividend * 1.2,
              canvasH - margin,
              margin
            )
            p.vertex(x, y)
            p.push()
            p.fill(0, 120, 255)
            p.ellipse(x, y, 6, 6)
            p.pop()
          })
          p.endShape()

          // Draw labels
          p.push()
          p.noStroke()
          p.fill(220)
          p.textAlign(p.CENTER)

          // X-axis labels
          for (let year = 0; year <= years; year += 2) {
            const x = p.map(year, 0, years, margin, canvasW - margin)
            p.text(year, x, canvasH - margin + 20)
          }
          p.text('Years', canvasW / 2, canvasH - 10)

          // Y-axis label
          p.push()
          p.translate(15, canvasH / 2)
          p.rotate(-p.HALF_PI)
          p.text('Dividend Amount ($)', 0, 0)
          p.pop()

          // Y-axis values
          const yLabels = 5
          for (let i = 0; i <= yLabels; i++) {
            const value = (maxDividend * i) / yLabels
            const y = p.map(
              value,
              0,
              maxDividend * 1.2,
              canvasH - margin,
              margin
            )
            p.textAlign(p.RIGHT)
            p.text(value.toFixed(2), margin - 10, y + 5)
          }
          p.pop()
        }
      }

      p5Instance.current = new p5(sketch, canvasRef.current)
    }

    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove()
        p5Instance.current = null
      }
    }
  }, [values])

  const updateCalculation = (newValues: typeof values) => {
    const returnRate = newValues.returnRate / 100
    const growthRate = newValues.growthRate / 100

    let stockValue
    if (returnRate <= growthRate) {
      stockValue = 'Invalid (r must be > g)'
    } else {
      stockValue = (newValues.dividend / (returnRate - growthRate)).toFixed(2)
    }

    setValues({ ...newValues, stockValue: parseFloat(stockValue) })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValues = {
      ...values,
      [e.target.name]: parseFloat(e.target.value),
    }
    updateCalculation(newValues)
  }

  return (
    <Card className='w-full max-w-4xl overflow-y-scroll bg-neutral-900 text-neutral-100'>
      <CardHeader>
        <CardTitle>Interactive Dividend Growth Model</CardTitle>
      </CardHeader>
      <CardContent>
        <p className='mb-4'>
          The Dividend Growth Model (Gordon Growth Model) is used to calculate
          the intrinsic value of a stock based on future dividend payments that
          grow at a constant rate.
        </p>

        <div className='mb-6 rounded-md bg-neutral-800 p-4'>
          <p className='mb-2 text-lg'>Formula: P = D₁ / (r - g)</p>
          <p className='mb-2'>Where:</p>
          <ul className='list-disc pl-6'>
            <li>P = Stock's intrinsic value</li>
            <li>D₁ = Expected dividend payment in the next year</li>
            <li>r = Required rate of return</li>
            <li>g = Expected constant growth rate of dividends</li>
          </ul>
        </div>

        <div className='flex flex-wrap gap-6'>
          <div className='min-w-[300px] flex-1'>
            <div className='mb-4'>
              <label className='mb-2 block font-bold'>
                Next Year's Expected Dividend (D₁):
              </label>
              <input
                type='number'
                name='dividend'
                value={values.dividend}
                onChange={handleInputChange}
                className='w-full rounded border border-neutral-700 bg-neutral-800 p-2'
                step='0.1'
                min='0'
              />
            </div>

            <div className='mb-4'>
              <label className='mb-2 block font-bold'>
                Required Rate of Return (r):
              </label>
              <input
                type='number'
                name='returnRate'
                value={values.returnRate}
                onChange={handleInputChange}
                className='w-full rounded border border-neutral-700 bg-neutral-800 p-2'
                step='0.1'
                min='0'
              />
            </div>

            <div className='mb-4'>
              <label className='mb-2 block font-bold'>
                Expected Growth Rate (g):
              </label>
              <input
                type='number'
                name='growthRate'
                value={values.growthRate}
                onChange={handleInputChange}
                className='w-full rounded border border-neutral-700 bg-neutral-800 p-2'
                step='0.1'
                min='0'
              />
            </div>

            <div className='rounded-md bg-neutral-800 p-4'>
              <p>Calculated Stock Value: ${values.stockValue}</p>
            </div>
          </div>

          <div className='min-w-[400px] flex-1' ref={canvasRef} />
        </div>
      </CardContent>
    </Card>
  )
}

export default DividendGrowthCalculator
