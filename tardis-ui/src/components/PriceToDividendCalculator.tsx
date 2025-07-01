import React, { useState, useEffect, useRef } from 'react'

const PriceToDividendCalculator = () => {
  const [price, setPrice] = useState(50)
  const [dividend, setDividend] = useState(2)
  const [pdRatio, setPdRatio] = useState(25)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Update the ratio when price or dividend changes
    const ratio = (price / dividend).toFixed(2)
    setPdRatio(parseFloat(ratio))

    // Draw the visualization
    drawVisualization()
  }, [price, dividend])

  useEffect(() => {
    // Initialize the visualization
    drawVisualization()
  }, [])

  const drawVisualization = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Dark background
    ctx.fillStyle = '#141414'
    ctx.fillRect(0, 0, width, height)

    // Grid lines
    ctx.strokeStyle = '#3c3c3c'
    ctx.lineWidth = 1
    for (let i = 0; i < width; i += 50) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, height)
      ctx.stroke()
    }
    for (let i = 0; i < height; i += 50) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(width, i)
      ctx.stroke()
    }

    // Scale values for visualization
    const scaledPrice = price * 1.5
    const scaledDividend = dividend * 15
    const ratio = pdRatio
    const ratioHeight = ratio * 3

    // Price bar (blue)
    ctx.fillStyle = 'rgb(65, 105, 225)'
    ctx.fillRect(100, height - scaledPrice, 100, scaledPrice)

    // Dividend bar (green)
    ctx.fillStyle = 'rgb(50, 205, 50)'
    ctx.fillRect(250, height - scaledDividend, 100, scaledDividend)

    // Ratio bar (orange)
    ctx.fillStyle = 'rgb(255, 140, 0)'
    ctx.fillRect(400, height - ratioHeight, 100, ratioHeight)

    // Labels
    ctx.fillStyle = '#dcdcdc'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Stock Price', 150, height - scaledPrice - 10)
    ctx.fillText('Annual Dividend', 300, height - scaledDividend - 10)
    ctx.fillText('P/D Ratio', 450, height - ratioHeight - 10)
  }

  return (
    <div className='mx-auto max-w-3xl overflow-y-auto rounded-lg bg-gray-900 p-6 text-gray-200 shadow-lg'>
      <h1 className='mb-4 text-2xl font-bold'>
        Price-to-Dividend (P/D) Ratio Calculator
      </h1>

      <div className='my-4 rounded bg-gray-800 p-4 text-center'>
        <span className='text-xl'>
          P/D Ratio = Stock Price / Annual Dividend
        </span>
      </div>

      <div className='mb-4 rounded bg-gray-800 p-4'>
        <h2 className='mb-3 text-xl'>Interactive Calculator</h2>

        <div className='mb-4'>
          <label className='mb-1 block'>Stock Price ($):</label>
          <input
            type='range'
            min='0'
            max='200'
            value={price}
            step='1'
            onChange={e => setPrice(parseFloat(e.target.value))}
            className='h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700'
          />
          <span className='text-gray-300'>{price}</span>
        </div>

        <div className='mb-4'>
          <label className='mb-1 block'>Annual Dividend ($):</label>
          <input
            type='range'
            min='0.1'
            max='10'
            value={dividend}
            step='0.1'
            onChange={e => setDividend(parseFloat(e.target.value))}
            className='h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700'
          />
          <span className='text-gray-300'>{dividend}</span>
        </div>

        <div className='text-xl'>
          P/D Ratio: <span className='font-bold'>{pdRatio}</span>
        </div>
      </div>

      <div className='mb-4'>
        <canvas
          ref={canvasRef}
          width={600}
          height={300}
          className='w-full rounded border border-gray-700'
        />
      </div>
    </div>
  )
}

export default PriceToDividendCalculator
