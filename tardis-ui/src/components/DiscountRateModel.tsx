import React, { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import p5 from 'p5'

const DiscountRateCalculator = () => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const p5Instance = useRef<p5 | null>(null)

  const [values, setValues] = useState({
    futureValue: 5000,
    discountRate: 5,
    time: 5,
    presentValue: 0,
  })

  useEffect(() => {
    if (canvasRef.current && !p5Instance.current) {
      const sketch = (p: p5) => {
        const canvasW = 600
        const canvasH = 300

        p.setup = () => {
          p.createCanvas(canvasW, canvasH)
        }

        p.draw = () => {
          p.background(40)
          drawGraph(p)
        }

        const drawGraph = (p: p5) => {
          const fixedMax = 12000

          // Draw axes
          p.stroke(220)
          p.line(50, 250, 550, 250) // x-axis
          p.line(50, 250, 50, 50) // y-axis

          // Draw labels
          p.textSize(12)
          p.fill(220)
          p.text('Time (years)', 275, 280)

          p.push()
          p.translate(25, 150)
          p.rotate(-p.HALF_PI)
          p.text('Value ($)', 0, 0)
          p.pop()

          // Plot present value curve
          p.stroke(0, 120, 255)
          p.noFill()
          p.beginShape()
          for (let t = 0; t <= values.time; t += 0.1) {
            const x = p.map(t, 0, values.time, 50, 550)
            const pv =
              values.futureValue / Math.pow(1 + values.discountRate / 100, t)
            const y = p.map(pv, 0, fixedMax, 250, 50)
            p.vertex(x, y)
          }
          p.endShape()

          // Plot future value line
          p.stroke(255, 120, 0)
          const yRed = p.map(values.futureValue, 0, fixedMax, 250, 50)
          p.line(50, yRed, 550, yRed)

          // Add legend
          p.noStroke()
          p.fill(0, 120, 255)
          p.rect(460, 30, 15, 15)
          p.fill(255, 120, 0)
          p.rect(460, 50, 15, 15)
          p.fill(220)
          p.text('Present Value', 480, 42)
          p.text('Future Value', 480, 62)
        }
      }

      p5Instance.current = new p5(sketch, canvasRef.current)
    }

    return () => {
      if (p5Instance.current) {
        ; (p5Instance.current as p5).remove()
        p5Instance.current = null
      }
    }
  }, [values])

  useEffect(() => {
    const pv =
      values.futureValue / Math.pow(1 + values.discountRate / 100, values.time)
    setValues(prev => ({ ...prev, presentValue: parseFloat(pv.toFixed(2)) }))
  }, [values.futureValue, values.discountRate, values.time])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues(prev => ({
      ...prev,
      [e.target.name]: parseFloat(e.target.value),
    }))
  }

  return (
    <Card className='w-full max-w-4xl overflow-y-auto bg-neutral-900 text-neutral-100'>
      <CardHeader>
        <CardTitle>Understanding Discount Rate Value</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='mb-6'>
          <h2 className='mb-4 text-xl font-bold'>What is Discount Rate?</h2>
          <p className='mb-4'>
            The discount rate is used to determine the present value of future
            cash flows. The basic formula for present value is:
          </p>
          <div className='my-4 text-center'>PV = FV / (1 + r)^t</div>
          <p className='mb-2'>Where:</p>
          <ul className='mb-6 list-disc pl-6'>
            <li>PV = Present Value</li>
            <li>FV = Future Value</li>
            <li>r = Discount Rate</li>
            <li>t = Time (in years)</li>
          </ul>
        </div>

        <div className='rounded-lg bg-neutral-800 p-6'>
          <h2 className='mb-4 text-xl font-bold'>Interactive Calculator</h2>

          <div className='mb-4'>
            <div className='mb-2 flex items-center'>
              <span className='w-40'>Future Value ($):</span>
              <input
                type='range'
                name='futureValue'
                min='1000'
                max='10000'
                step='100'
                value={values.futureValue}
                onChange={handleSliderChange}
                className='mr-4 w-48 bg-neutral-700'
              />
              <span>{values.futureValue}</span>
            </div>

            <div className='mb-2 flex items-center'>
              <span className='w-40'>Discount Rate (%):</span>
              <input
                type='range'
                name='discountRate'
                min='0'
                max='20'
                step='0.5'
                value={values.discountRate}
                onChange={handleSliderChange}
                className='mr-4 w-48 bg-neutral-700'
              />
              <span>{values.discountRate}</span>
            </div>

            <div className='mb-2 flex items-center'>
              <span className='w-40'>Time (years):</span>
              <input
                type='range'
                name='time'
                min='1'
                max='10'
                step='1'
                value={values.time}
                onChange={handleSliderChange}
                className='mr-4 w-48 bg-neutral-700'
              />
              <span>{values.time}</span>
            </div>
          </div>

          <div className='mb-4'>
            <h3 className='mb-2 text-lg font-bold'>Results:</h3>
            <p>Present Value: ${values.presentValue}</p>
          </div>

          <div ref={canvasRef} className='rounded border border-neutral-700' />
        </div>
      </CardContent>
    </Card>
  )
}

export default DiscountRateCalculator
