import React, { useState, useRef, useEffect } from 'react';

const LiquidationValueCalculator = () => {
  // Initialize asset values
  const assets = {
    cash: 1000000,
    receivables: 800000,
    inventory: 1200000,
    fixedAssets: 2000000
  };

  // State for discount percentages
  const [discounts, setDiscounts] = useState({
    cash: 0,
    ar: 20,
    inventory: 40,
    fixed: 60
  });

  // Calculate liquidation values
  const liquidationValues = {
    cash: assets.cash * (1 - discounts.cash / 100),
    ar: assets.receivables * (1 - discounts.ar / 100),
    inventory: assets.inventory * (1 - discounts.inventory / 100),
    fixed: assets.fixedAssets * (1 - discounts.fixed / 100)
  };

  const totalBookValue = assets.cash + assets.receivables + assets.inventory + assets.fixedAssets;
  const totalLiquidationValue = liquidationValues.cash + liquidationValues.ar +
    liquidationValues.inventory + liquidationValues.fixed;

  // Helper for formatting numbers with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };

  // Handle slider changes
  const handleDiscountChange = (type, value) => {
    setDiscounts(prev => ({
      ...prev,
      [type]: Number(value)
    }));
  };

  // Canvas ref for p5.js sketch
  const canvasRef = useRef(null);

  useEffect(() => {
    // This effect runs the p5.js sketch
    if (!canvasRef.current) return;

    let ctx = canvasRef.current.getContext('2d');
    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;

    // Clear the canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw stacked bar chart
    const barWidth = 80;
    const maxHeight = 300;
    const y = height - 50;

    const drawBar = (x, yPos, w, cashVal, arVal, invVal, fixedVal, total, lbl) => {
      const scale = maxHeight / total;
      let currentY = yPos;

      // Cash segment
      ctx.fillStyle = '#e882b4'; // Pink/purple for cash
      const cashHeight = cashVal * scale;
      ctx.fillRect(x - w/2, currentY - cashHeight, w, cashHeight);
      currentY -= cashHeight;

      // AR segment
      ctx.fillStyle = '#7396e8'; // Blue for AR
      const arHeight = arVal * scale;
      ctx.fillRect(x - w/2, currentY - arHeight, w, arHeight);
      currentY -= arHeight;

      // Inventory segment
      ctx.fillStyle = '#82c890'; // Green for inventory
      const invHeight = invVal * scale;
      ctx.fillRect(x - w/2, currentY - invHeight, w, invHeight);
      currentY -= invHeight;

      // Fixed assets segment
      ctx.fillStyle = '#e8c273'; // Yellow/Gold for fixed assets
      const fixedHeight = fixedVal * scale;
      ctx.fillRect(x - w/2, currentY - fixedHeight, w, fixedHeight);

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = '14px Arial';
      ctx.fillText(lbl, x, yPos + 20);
    };

    // Draw Book Value Bar
    drawBar(
      width / 3,
      y,
      barWidth,
      assets.cash,
      assets.receivables,
      assets.inventory,
      assets.fixedAssets,
      totalBookValue,
      "Book Value"
    );

    // Draw Liquidation Value Bar
    drawBar(
      2 * width / 3,
      y,
      barWidth,
      liquidationValues.cash,
      liquidationValues.ar,
      liquidationValues.inventory,
      liquidationValues.fixed,
      totalLiquidationValue,
      "Liquidation Value"
    );

  }, [discounts, assets, liquidationValues, totalBookValue, totalLiquidationValue]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-gray-200 rounded-lg overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4">Understanding Liquidation Value</h1>
      <div className="mb-4">
        <p>Liquidation value is the estimated amount that could be realized by selling a company's assets in a
          forced or orderly liquidation. Let's explore how it's calculated:</p>
      </div>

      <div className="flex flex-wrap md:flex-nowrap gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-md w-full md:w-64 flex-shrink-0">
          <p>The basic formula for liquidation value is:</p>
          <div className="my-2 text-center">
            <p>Liquidation Value = Σ(A<sub>i</sub> × (1-D<sub>i</sub>))</p>
          </div>
          <p className="text-sm mt-2">
            where:<br />
            A<sub>i</sub> = Asset Value<br />
            D<sub>i</sub> = Discount Factor
          </p>
        </div>
        <div className="flex-grow">
          <canvas
            ref={canvasRef}
            width="400"
            height="400"
            className="bg-gray-800 rounded-md w-full h-64 md:h-auto"
          />
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block mb-2">Cash and Equivalents Discount (%):</label>
          <input
            type="range"
            min="0"
            max="100"
            value={discounts.cash}
            onChange={(e) => handleDiscountChange('cash', e.target.value)}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm">{discounts.cash}%</span>
        </div>

        <div>
          <label className="block mb-2">Accounts Receivable Discount (%):</label>
          <input
            type="range"
            min="0"
            max="100"
            value={discounts.ar}
            onChange={(e) => handleDiscountChange('ar', e.target.value)}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm">{discounts.ar}%</span>
        </div>

        <div>
          <label className="block mb-2">Inventory Discount (%):</label>
          <input
            type="range"
            min="0"
            max="100"
            value={discounts.inventory}
            onChange={(e) => handleDiscountChange('inventory', e.target.value)}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm">{discounts.inventory}%</span>
        </div>

        <div>
          <label className="block mb-2">Fixed Assets Discount (%):</label>
          <input
            type="range"
            min="0"
            max="100"
            value={discounts.fixed}
            onChange={(e) => handleDiscountChange('fixed', e.target.value)}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm">{discounts.fixed}%</span>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-md">
        <h3 className="text-lg font-semibold mb-2">Liquidation Value Calculation:</h3>
        <p>
          Total Book Value: ${formatNumber(totalBookValue)}<br />
          Total Liquidation Value: ${formatNumber(totalLiquidationValue)}<br />
          Discount to Book Value: {((1 - totalLiquidationValue / totalBookValue) * 100).toFixed(1)}%
        </p>
      </div>
    </div>
  );
};

export default LiquidationValueCalculator;
