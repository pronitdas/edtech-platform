import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PERatioCalculator = () => {
  const [price, setPrice] = useState(50);
  const [eps, setEps] = useState(2);
  const canvasRef = useRef(null);

  const drawVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas with dark background
    ctx.fillStyle = 'rgb(30, 30, 30)';
    ctx.fillRect(0, 0, width, height);

    const barWidth = 80;
    const maxHeight = 200;

    // Draw Price bar
    ctx.fillStyle = 'rgb(70, 130, 180)';
    const priceHeight = (price / 200) * maxHeight;
    ctx.fillRect(width / 4 - barWidth / 2, height - priceHeight, barWidth, priceHeight);

    // Draw EPS bar
    ctx.fillStyle = 'rgb(95, 158, 160)';
    const epsHeight = (eps / 10) * maxHeight;
    ctx.fillRect(width / 2 - barWidth / 2, height - epsHeight, barWidth, epsHeight);

    // Draw P/E ratio visualization
    ctx.fillStyle = 'rgba(70, 130, 180, 0.6)';
    const pe = price / eps;
    const peHeight = (pe / 50) * maxHeight;
    ctx.fillRect(3 * width / 4 - barWidth / 2, height - peHeight, barWidth, peHeight);

    // Draw labels
    ctx.fillStyle = 'rgb(220, 220, 220)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Price: $${price.toFixed(2)}`, width / 4, height - priceHeight - 20);
    ctx.fillText(`EPS: $${eps.toFixed(2)}`, width / 2, height - epsHeight - 20);
    ctx.fillText(`P/E: ${(price / eps).toFixed(2)}`, 3 * width / 4, height - peHeight - 20);
  };

  useEffect(() => {
    drawVisualization();
  }, [price, eps]);

  return (
      <Card className="overflow-y-auto  bg-zinc-900 text-gray-200">
        <CardHeader>
          <CardTitle className="text-2xl">Understanding Price to Earnings (P/E) Ratio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px] bg-zinc-800 p-4 rounded-lg">
              <h2 className="text-xl mb-4">The Formula</h2>
              <p className="mb-2">The P/E Ratio is calculated as:</p>
              <p className="text-lg font-mono">P/E = Market Price per Share / Earnings per Share (EPS)</p>
            </div>

            <div className="flex-1 min-w-[300px] bg-zinc-800 p-4 rounded-lg">
              <h2 className="text-xl mb-4">Interactive P/E Calculator</h2>
              <div className="mb-4">
                <label className="block mb-2">
                  Stock Price ($): {price}
                  <input
                    type="range"
                    min="1"
                    max="200"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full mt-2"
                  />
                </label>
              </div>
              <div className="mb-4">
                <label className="block mb-2">
                  EPS ($): {eps}
                  <input
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={eps}
                    onChange={(e) => setEps(Number(e.target.value))}
                    className="w-full mt-2"
                  />
                </label>
              </div>
              <div className="text-blue-300 font-bold">
                P/E Ratio: {(price / eps).toFixed(2)}
              </div>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={600}
            height={300}
            className="w-full mt-4 rounded-lg"
          />

          <div className="mt-6 bg-zinc-800 p-4 rounded-lg">
            <h2 className="text-xl mb-4">What Does P/E Ratio Tell Us?</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>How much investors are willing to pay for $1 of earnings</li>
              <li>Whether a stock might be overvalued or undervalued</li>
              <li>How a company's valuation compares to its peers</li>
            </ul>
          </div>
        </CardContent>
      </Card>
  );
};

export default PERatioCalculator;
