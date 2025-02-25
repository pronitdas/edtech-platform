import React, { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

class Company {
  constructor(width, height) {
    this.x = Math.random() * (width - 100) + 50;
    this.y = Math.random() * (height - 100) + 50;
    this.earnings = Math.random() * 90 + 10; // 10 to 100
    this.volatility = Math.random() * 0.2 + 0.1; // 0.1 to 0.3
    this.basePrice = this.earnings * (Math.random() * 12 + 8); // 8 to 20 multiplier
  }

  update(risk, frameCount, width, height) {
    const riskFactor = risk / 50;
    const priceMultiplier = (1.5 - riskFactor);
    this.currentPrice = this.basePrice * priceMultiplier *
      (1 + Math.sin(frameCount * this.volatility) * (riskFactor * 0.2));
    this.pe = Math.max(1, this.currentPrice / this.earnings); // Ensure PE is at least 1

    // Add movement based on risk
    const movement = (risk / 100) * 2 + 1;
    this.x += (Math.random() * 2 - 1) * movement;
    this.y += (Math.random() * 2 - 1) * movement;

    // Keep within bounds
    this.x = Math.max(50, Math.min(width - 50, this.x));
    this.y = Math.max(50, Math.min(height - 50, this.y));
  }
}

const PERatioVisualization = () => {
  const [riskLevel, setRiskLevel] = useState(50);
  const canvasRef = useRef(null);
  const companiesRef = useRef([]);
  const frameCountRef = useRef(0);
  const animationFrameRef = useRef();
  const [hoveredCompany, setHoveredCompany] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const getRiskDescription = (risk) => {
    if (risk < 30) return "Low Risk Environment: Investors are confident, willing to pay premium prices (Higher P/E)";
    if (risk < 70) return "Moderate Risk: Balanced market sentiment";
    return "High Risk Environment: Investors demand lower prices relative to earnings (Lower P/E)";
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Initialize companies if not already done
    if (companiesRef.current.length === 0) {
      companiesRef.current = Array.from({ length: 20 }, () => new Company(width, height));
    }

    const draw = () => {
      ctx.fillStyle = '#223344';
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update and draw companies
      let totalPE = 0;
      companiesRef.current.forEach((company, index) => {
        company.update(riskLevel, frameCountRef.current, width, height);
        totalPE += company.pe;

        // Calculate circle size with a minimum radius
        const minRadius = 5;
        const radiusScale = 1.5;
        const radius = Math.max(minRadius, (company.pe - 5) * radiusScale + 5);

        // Draw company circle
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillStyle = `rgba(255, ${200 + Math.random() * 50}, ${100 + Math.random() * 50}, 0.7)`;
        ctx.arc(company.x, company.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Check if mouse is hovering over this company
        const dx = mousePos.x - company.x;
        const dy = mousePos.y - company.y;
        if (dx * dx + dy * dy < 225) { // 15^2
          setHoveredCompany({
            pe: company.pe,
            price: company.currentPrice,
            earnings: company.earnings,
            x: company.x,
            y: company.y
          });
        }
      });

      // Draw market average
      ctx.fillStyle = 'white';
      ctx.font = '14px "Courier New"';
      ctx.fillText(`Market Average PE: ${(totalPE / companiesRef.current.length).toFixed(1)}`, 20, 30);

      // Draw axis label
      ctx.textAlign = 'center';
      ctx.fillText("← Lower Risk | Higher Risk →", width / 2, height - 10);
      ctx.textAlign = 'left';

      frameCountRef.current++;
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [riskLevel, mousePos]);

  return (
    <Card className="overflow-y-auto w-full bg-slate-800 text-white">
      <CardHeader>
        <CardTitle className="text-xl">P/E Ratio & Market Risk Relationship</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-black/30 p-4 rounded-lg">
            <p>This visualization demonstrates how Price-to-Earnings (P/E) ratios respond to market risk levels. Each
              circle represents a company.</p>
          </div>

          <div className="bg-black/30 p-4 rounded-lg space-y-2">
            <label className="block">Market Risk Level (drag to adjust):</label>
            <input
              type="range"
              className="w-full"
              min="0"
              max="100"
              value={riskLevel}
              onChange={(e) => setRiskLevel(parseInt(e.target.value))}
            />
            <div>{getRiskDescription(riskLevel)}</div>
          </div>

          <div className="relative h-[300px]">
            <canvas
              ref={canvasRef}
              width={800}
              height={300}
              className="w-full h-full"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setMousePos({
                  x: (e.clientX - rect.left) * (e.currentTarget.width / rect.width),
                  y: (e.clientY - rect.top) * (e.currentTarget.height / rect.height)
                });
              }}
              onMouseLeave={() => setHoveredCompany(null)}
            />
            {hoveredCompany && (
              <div
                className="absolute bg-black/80 p-2 rounded text-sm"
                style={{
                  left: `${hoveredCompany.x + 15}px`,
                  top: `${hoveredCompany.y}px`
                }}
              >
                <div>PE: {hoveredCompany.pe.toFixed(1)}</div>
                <div>Price: ${hoveredCompany.price.toFixed(0)}</div>
                <div>Earnings: ${hoveredCompany.earnings.toFixed(0)}</div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Understanding the Visualization:</h3>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full bg-white/70"></div>
              <span>Circle Size = P/E Ratio (larger = higher P/E)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full bg-[rgba(255,200,100,0.7)]"></div>
              <span>Circle Movement = Market Volatility</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Key Insights:</h3>
            <p>→ Lower Risk: Investors are confident in earnings, willing to pay higher prices (higher P/E)</p>
            <p>→ Higher Risk: Investors demand lower prices relative to earnings (lower P/E)</p>
            <p>→ Circle Pulsing: Represents market uncertainty and price fluctuations</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PERatioVisualization;
