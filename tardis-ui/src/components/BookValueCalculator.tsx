import React, { useState, useEffect, useRef } from 'react'
import p5 from 'p5'

const BookValueCalculator = () => {
  const [assets, setAssets] = useState(1000000)
  const [liabilities, setLiabilities] = useState(400000)
  const [shares, setShares] = useState(10000)
  const [marketPrice, setMarketPrice] = useState(70)
  const [bookValue, setBookValue] = useState(0)
  const [ratio, setRatio] = useState(0)
  const canvasRef = useRef<HTMLDivElement>(null)
  const p5Instance = useRef<p5 | null>(null)

  useEffect(() => {
    // Calculate book value whenever inputs change
    const calculatedBookValue = (assets - liabilities) / shares
    setBookValue(calculatedBookValue)
    setRatio(marketPrice / calculatedBookValue)
  }, [assets, liabilities, shares, marketPrice])

  useEffect(() => {
    // Initialize p5.js sketch
    if (canvasRef.current && !p5Instance.current) {
      p5Instance.current = new p5(sketch, canvasRef.current)
    }

    // Cleanup function to remove p5 instance when component unmounts
    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove()
      }
    }
  }, [])

  // Function to get analysis text based on ratio
  const getAnalysis = () => {
    if (ratio > 1.2) {
      return "The stock might be overvalued as it's trading significantly above its book value."
    } else if (ratio < 0.8) {
      return "The stock might be undervalued as it's trading significantly below its book value."
    } else {
      return 'The stock is trading close to its book value.'
    }
  }

  // P5.js sketch definition
  const sketch = (p: p5) => {
    let targetBookValueHeight = 0
    let targetMarketPriceHeight = 0
    let currentBookValueHeight = 0
    let currentMarketPriceHeight = 0
    const animationSpeed = 0.1
    const barWidth = 100
    const spacing = 50

    p.setup = () => {
      p.createCanvas(600, 300)
    }

    p.draw = () => {
      // Use a dark background for the canvas
      p.background(30)

      // Calculate target heights for animated bars
      targetBookValueHeight = p.map(
        bookValue,
        0,
        p.max(bookValue, marketPrice) * 1.2,
        0,
        180
      )
      targetMarketPriceHeight = p.map(
        marketPrice,
        0,
        p.max(bookValue, marketPrice) * 1.2,
        0,
        180
      )

      // Animate current bar heights
      currentBookValueHeight = p.lerp(
        currentBookValueHeight,
        targetBookValueHeight,
        animationSpeed
      )
      currentMarketPriceHeight = p.lerp(
        currentMarketPriceHeight,
        targetMarketPriceHeight,
        animationSpeed
      )

      // Draw axes and grid lines
      p.stroke(70)
      p.strokeWeight(1)

      for (let i = 0; i <= 5; i++) {
        const y = 250 - i * 40
        p.line(50, y, 550, y)
        p.noStroke()
        p.fill(200)
        p.textAlign(p.RIGHT)
        p.textSize(10)
        p.text(
          (((p.max(bookValue, marketPrice) * 1.2) / 5) * i).toFixed(1),
          45,
          y + 4
        )
      }

      // Calculate positions for the bars
      const x1 = p.width / 2 - spacing - barWidth
      const x2 = p.width / 2 + spacing

      // Draw Book Value bar
      p.noStroke()
      p.fill(59, 130, 246, 75) // Shadow effect
      p.rect(
        x1 + 4,
        250 - currentBookValueHeight + 4,
        barWidth,
        currentBookValueHeight,
        8
      )
      p.fill(59, 130, 246) // Main bar
      p.rect(
        x1,
        250 - currentBookValueHeight,
        barWidth,
        currentBookValueHeight,
        8
      )

      // Draw Market Price bar
      p.fill(239, 68, 68, 75)
      p.rect(
        x2 + 4,
        250 - currentMarketPriceHeight + 4,
        barWidth,
        currentMarketPriceHeight,
        8
      )
      p.fill(239, 68, 68)
      p.rect(
        x2,
        250 - currentMarketPriceHeight,
        barWidth,
        currentMarketPriceHeight,
        8
      )

      // Display the numerical values on the bars
      p.textAlign(p.CENTER)
      p.textSize(14)
      p.fill(255)
      p.text(
        '$' + bookValue.toFixed(2),
        x1 + barWidth / 2,
        250 - currentBookValueHeight + 25
      )
      p.text(
        '$' + marketPrice.toFixed(2),
        x2 + barWidth / 2,
        250 - currentMarketPriceHeight + 25
      )

      // Label the bars
      p.fill(200)
      p.textSize(12)
      p.text('Book Value', x1 + barWidth / 2, 270)
      p.text('Market Price', x2 + barWidth / 2, 270)

      // Draw comparison indicator at the top
      const comparisonY = 30
      p.textAlign(p.CENTER)
      p.textSize(14)

      if (ratio > 1.2) {
        p.fill(239, 68, 68)
        p.text('Overvalued', p.width / 2, comparisonY)
      } else if (ratio < 0.8) {
        p.fill(34, 197, 94)
        p.text('Undervalued', p.width / 2, comparisonY)
      } else {
        p.fill(59, 130, 246)
        p.text('Fair Value', p.width / 2, comparisonY)
      }

      p.textSize(12)
      p.text(
        'Price-to-Book Ratio: ' + ratio.toFixed(2),
        p.width / 2,
        comparisonY + 20
      )

      // Apply gradient overlay on the bars (simplified for React version)
      p.drawingContext.save()
      const gradient1 = p.drawingContext.createLinearGradient(
        0,
        250 - currentBookValueHeight,
        0,
        250
      )
      gradient1.addColorStop(0, 'rgba(59, 130, 246, 1)')
      gradient1.addColorStop(1, 'rgba(59, 130, 246, 0.7)')
      p.drawingContext.fillStyle = gradient1
      p.drawingContext.fillRect(
        x1,
        250 - currentBookValueHeight,
        barWidth,
        currentBookValueHeight
      )

      const gradient2 = p.drawingContext.createLinearGradient(
        0,
        250 - currentMarketPriceHeight,
        0,
        250
      )
      gradient2.addColorStop(0, 'rgba(239, 68, 68, 1)')
      gradient2.addColorStop(1, 'rgba(239, 68, 68, 0.7)')
      p.drawingContext.fillStyle = gradient2
      p.drawingContext.fillRect(
        x2,
        250 - currentMarketPriceHeight,
        barWidth,
        currentMarketPriceHeight
      )
      p.drawingContext.restore()

      // Add a hover effect for interactive feedback
      if (
        p.mouseX > x1 &&
        p.mouseX < x1 + barWidth &&
        p.mouseY > 250 - currentBookValueHeight &&
        p.mouseY < 250
      ) {
        p.fill(59, 130, 246, 50)
        p.rect(
          x1,
          250 - currentBookValueHeight,
          barWidth,
          currentBookValueHeight,
          8
        )
      }
      if (
        p.mouseX > x2 &&
        p.mouseX < x2 + barWidth &&
        p.mouseY > 250 - currentMarketPriceHeight &&
        p.mouseY < 250
      ) {
        p.fill(239, 68, 68, 50)
        p.rect(
          x2,
          250 - currentMarketPriceHeight,
          barWidth,
          currentMarketPriceHeight,
          8
        )
      }
    }
  }

  return (
    <div className='overflow-y-auto bg-gray-900 p-6'>
      <div className='mx-auto max-w-4xl rounded-xl bg-gray-800 p-8 shadow-lg'>
        <h1 className='mb-6 text-3xl font-bold text-white'>
          Book Value vs Market Price
          <div className='mt-2 h-1 w-20 bg-blue-500'></div>
        </h1>

        <div className='mb-8 rounded-lg bg-gray-700 p-6 shadow-sm'>
          <h3 className='mb-4 text-xl font-semibold text-white'>
            Book Value Formula:
          </h3>
          <div className='text-lg text-gray-300'>
            BookValue = (TotalAssets - TotalLiabilities) / NumberOfShares
          </div>
        </div>

        <div className='mb-8 grid gap-8 md:grid-cols-2'>
          <div className='space-y-6'>
            <div className='space-y-4'>
              <div className='relative'>
                <label
                  htmlFor='assets'
                  className='mb-1 block text-sm font-medium text-gray-300'
                >
                  Total Assets ($)
                </label>
                <input
                  type='number'
                  id='assets'
                  value={assets}
                  min='0'
                  onChange={e => setAssets(parseFloat(e.target.value) || 0)}
                  className='mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-lg text-white shadow-sm focus:border-blue-400 focus:ring-blue-400'
                />
              </div>

              <div className='relative'>
                <label
                  htmlFor='liabilities'
                  className='mb-1 block text-sm font-medium text-gray-300'
                >
                  Total Liabilities ($)
                </label>
                <input
                  type='number'
                  id='liabilities'
                  value={liabilities}
                  min='0'
                  onChange={e =>
                    setLiabilities(parseFloat(e.target.value) || 0)
                  }
                  className='mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-lg text-white shadow-sm focus:border-blue-400 focus:ring-blue-400'
                />
              </div>

              <div className='relative'>
                <label
                  htmlFor='shares'
                  className='mb-1 block text-sm font-medium text-gray-300'
                >
                  Number of Shares
                </label>
                <input
                  type='number'
                  id='shares'
                  value={shares}
                  min='1'
                  onChange={e => setShares(parseFloat(e.target.value) || 1)}
                  className='mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-lg text-white shadow-sm focus:border-blue-400 focus:ring-blue-400'
                />
              </div>

              <div className='relative'>
                <label
                  htmlFor='marketPrice'
                  className='mb-1 block text-sm font-medium text-gray-300'
                >
                  Current Market Price ($)
                </label>
                <input
                  type='number'
                  id='marketPrice'
                  value={marketPrice}
                  min='0'
                  step='0.01'
                  onChange={e =>
                    setMarketPrice(parseFloat(e.target.value) || 0)
                  }
                  className='mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-lg text-white shadow-sm focus:border-blue-400 focus:ring-blue-400'
                />
              </div>
            </div>
          </div>

          <div className='rounded-lg bg-gray-700 p-6 shadow-sm'>
            <h3 className='mb-4 text-xl font-semibold text-white'>
              Analysis Results
            </h3>
            <div className='space-y-4'>
              <div className='flex items-center justify-between border-b border-gray-600 pb-2'>
                <span className='text-gray-300'>Book Value per Share:</span>
                <span className='text-lg font-semibold text-blue-400'>
                  ${bookValue.toFixed(2)}
                </span>
              </div>
              <div className='flex items-center justify-between border-b border-gray-600 pb-2'>
                <span className='text-gray-300'>Market Price per Share:</span>
                <span className='text-lg font-semibold text-green-400'>
                  ${marketPrice.toFixed(2)}
                </span>
              </div>
              <div className='flex items-center justify-between border-b border-gray-600 pb-2'>
                <span className='text-gray-300'>Price-to-Book Ratio:</span>
                <span
                  className={`text-lg font-semibold ${ratio > 1.2 ? 'text-red-400' : ratio < 0.8 ? 'text-green-400' : 'text-blue-400'}`}
                >
                  {ratio.toFixed(2)}
                </span>
              </div>
              <div
                className={`mt-4 rounded-lg p-4 ${ratio > 1.2
                  ? 'bg-red-800 text-red-300'
                  : ratio < 0.8
                    ? 'bg-green-800 text-green-300'
                    : 'bg-blue-800 text-blue-300'
                  }`}
              >
                {getAnalysis()}
              </div>
            </div>
          </div>
        </div>

        <div className='rounded-lg border border-gray-600 bg-gray-700 p-4 shadow-sm'>
          <div ref={canvasRef} />
        </div>
      </div>
    </div>
  )
}

export default BookValueCalculator
