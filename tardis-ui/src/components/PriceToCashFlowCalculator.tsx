import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'

const PriceToCashFlowCalculator = () => {
  const [marketPrice, setMarketPrice] = useState(50)
  const [cashFlow, setCashFlow] = useState(5)
  const [pcfRatio, setPcfRatio] = useState(10)

  useEffect(() => {
    if (cashFlow > 0) {
      const ratio = marketPrice / cashFlow
      setPcfRatio(ratio)
    }
  }, [marketPrice, cashFlow])

  const getInterpretation = ratio => {
    if (ratio < 10) {
      return {
        message:
          'This company might be undervalued relative to its cash flows.',
        color: 'bg-green-700/20 text-green-300 border-green-600/40',
      }
    } else if (ratio > 20) {
      return {
        message: 'This company might be overvalued relative to its cash flows.',
        color: 'bg-red-700/20 text-red-300 border-red-600/40',
      }
    }
    return {
      message:
        'This company appears to be reasonably valued relative to its cash flows.',
      color: 'bg-blue-700/20 text-blue-300 border-blue-600/40',
    }
  }

  const interpretation = getInterpretation(pcfRatio)

  const handleMarketPriceChange = e => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value) && value >= 0) {
      setMarketPrice(value)
    }
  }

  const handleCashFlowChange = e => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value) && value > 0) {
      setCashFlow(value)
    }
  }

  return (
    <div className='mx-auto max-w-2xl'>
      <Card className='h-full overflow-y-auto border-zinc-700 bg-zinc-800'>
        <CardContent className='p-6'>
          <h2 className='mb-2 text-2xl font-bold text-gray-100'>
            Price to Cash Flow Calculator
          </h2>
          <p className='mb-6 text-gray-400'>
            Evaluate a company's valuation relative to its operating cash flow.
          </p>

          <div className='mb-6 rounded-lg bg-zinc-700 p-4 text-center'>
            <p className='text-lg font-medium text-gray-100'>
              Price to Cash Flow Ratio = Market Price per Share ÷ Operating Cash
              Flow per Share
            </p>
          </div>

          <div className='mb-6 space-y-4'>
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-300'>
                Market Price per Share ($)
              </label>
              <input
                type='number'
                value={marketPrice}
                onChange={handleMarketPriceChange}
                min='0'
                step='0.01'
                className='w-full rounded border border-zinc-600 bg-zinc-700 p-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium text-gray-300'>
                Operating Cash Flow per Share ($)
              </label>
              <input
                type='number'
                value={cashFlow}
                onChange={handleCashFlowChange}
                min='0.01'
                step='0.01'
                className='w-full rounded border border-zinc-600 bg-zinc-700 p-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>

          <div className='space-y-4'>
            <div className='rounded-lg bg-zinc-700 p-4'>
              <p className='text-lg font-medium text-gray-100'>
                Price to Cash Flow Ratio:{' '}
                <span className='text-blue-400'>{pcfRatio.toFixed(2)}</span>
              </p>
            </div>

            <div className={`rounded-lg border p-4 ${interpretation.color}`}>
              <p className='text-sm'>{interpretation.message}</p>
            </div>

            <div className='space-y-2 rounded-lg bg-zinc-700 p-4'>
              <h3 className='font-semibold text-gray-100'>
                Understanding the Results:
              </h3>
              <ul className='list-disc space-y-1 pl-6 text-gray-300'>
                <li>P/CF {'<'} 10: May indicate undervaluation</li>
                <li>P/CF 10-20: Generally considered normal range</li>
                <li>P/CF {'>'} 20: May indicate overvaluation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PriceToCashFlowCalculator
