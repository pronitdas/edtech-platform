import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const StockValuationModel = () => {
  const [dividend, setDividend] = useState(2);
  const [growth, setGrowth] = useState(3);
  const [requiredReturn, setRequiredReturn] = useState(10);
  const [stockPrice, setStockPrice] = useState(0);
  const [priceHistory, setPriceHistory] = useState([]);
  const canvasRef = useRef(null);

  useEffect(() => {
    calculateStockPrice();
  }, [dividend, growth, requiredReturn]);

  const calculateStockPrice = () => {
    const growthRate = growth / 100;
    const returnRate = requiredReturn / 100;

    if (returnRate <= growthRate) {
      setStockPrice(null);
      return;
    }

    const price = (dividend * (1 + growthRate)) / (returnRate - growthRate);
    setStockPrice(price);
    setPriceHistory(prev => {
      const newHistory = [...prev, price];
      return newHistory.slice(-50);
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = 600;
    const height = 300;

    // Set canvas resolution
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Draw graph
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = '#dcdcdc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, height - 50);
    ctx.lineTo(width - 50, height - 50);
    ctx.moveTo(50, 50);
    ctx.lineTo(50, height - 50);
    ctx.stroke();

    // Draw x-axis ticks and labels
    const xStep = (width - 100) / 50;
    ctx.textAlign = 'center';
    ctx.font = '10px Arial';
    ctx.fillStyle = '#dcdcdc';
    for (let i = 0; i <= 50; i += 10) {
      const x = 50 + i * xStep;
      ctx.beginPath();
      ctx.moveTo(x, height - 50);
      ctx.lineTo(x, height - 45);
      ctx.stroke();
      ctx.fillText(i.toString(), x, height - 35);
    }

    // Draw y-axis labels
    if (priceHistory.length > 0) {
      const maxPrice = Math.max(...priceHistory) * 1.1;
      const yIntervals = 5;
      ctx.textAlign = 'right';

      for (let j = 0; j <= yIntervals; j++) {
        const value = (maxPrice / yIntervals) * j;
        const y = height - 50 - ((height - 100) * (value / maxPrice));
        ctx.beginPath();
        ctx.moveTo(45, y);
        ctx.lineTo(50, y);
        ctx.stroke();
        ctx.fillText(value.toFixed(2), 45, y);
      }

      // Draw price history
      ctx.strokeStyle = '#0096ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      priceHistory.forEach((price, i) => {
        const x = 50 + i * xStep;
        const y = height - 50 - ((height - 100) * (price / maxPrice));
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

  }, [priceHistory]);

  return (
    <Card className="overflow-y-auto w-full max-w-6xl bg-neutral-900">
      <CardHeader>
        <CardTitle className="text-neutral-100">Interactive Stock Valuation Model</CardTitle>
        <p className="text-neutral-300">This tool demonstrates the Dividend Discount Model (DDM) for stock valuation.</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64">
            <div className="bg-neutral-800 p-4 rounded-lg mb-4">
              <strong className="text-neutral-100">Formula:</strong>
              <p className="text-neutral-300 mt-2">P = D₀(1+g)/(r-g)</p>
              <ul className="list-disc ml-4 mt-2 text-neutral-300">
                <li>P = Stock Price</li>
                <li>D₀ = Current Dividend</li>
                <li>g = Growth Rate</li>
                <li>r = Required Rate of Return</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-neutral-300 mb-1">Current Dividend ($)</label>
                <input
                  type="number"
                  value={dividend}
                  onChange={(e) => setDividend(parseFloat(e.target.value))}
                  className="w-full bg-neutral-800 text-neutral-100 border border-neutral-700 rounded p-2"
                  step="0.1"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-neutral-300 mb-1">Growth Rate (%)</label>
                <input
                  type="number"
                  value={growth}
                  onChange={(e) => setGrowth(parseFloat(e.target.value))}
                  className="w-full bg-neutral-800 text-neutral-100 border border-neutral-700 rounded p-2"
                  step="0.1"
                  min="0"
                  max="20"
                />
              </div>
              <div>
                <label className="block text-neutral-300 mb-1">Required Return (%)</label>
                <input
                  type="number"
                  value={requiredReturn}
                  onChange={(e) => setRequiredReturn(parseFloat(e.target.value))}
                  className="w-full bg-neutral-800 text-neutral-100 border border-neutral-700 rounded p-2"
                  step="0.1"
                  min="0"
                  max="30"
                />
              </div>
              <div className="text-neutral-100 mt-4">
                {stockPrice === null ? (
                  'Error: Required return must be greater than growth rate'
                ) : (
                  `Calculated Stock Price: $${stockPrice.toFixed(2)}`
                )}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <canvas
              ref={canvasRef}
              className="border border-neutral-700 rounded-lg w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockValuationModel;
