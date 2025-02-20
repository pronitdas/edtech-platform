import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import useAuthState from '@/hooks/useAuth';
import { OpenAIClient } from '@/services/openAi';

const MindMap = ({ markdown }) => {
  const [mindMapData, setMindMapData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef(null);
  const { oAiKey } = useAuthState();
  const [apiClient, setApiClient] = useState(null);

  useEffect(() => {
    if (!apiClient && oAiKey) {
      setApiClient(new OpenAIClient(oAiKey));
    }
  }, [oAiKey, apiClient]);

  const cleanAndParseJSON = (text) => {
    // Remove any markdown code block syntax
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    // Remove any trailing or leading whitespace
    cleaned = cleaned.trim();

    try {
      return JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      console.log("Attempted to parse:", cleaned);
      return null;
    }
  };

  const generateMindMapStructure = useCallback(async (markdown) => {
    if (!apiClient) return null;

    try {
      const prompt = `Generate a mind map structure from this markdown content as a JSON object. The JSON should have this exact structure, you can add things if you want for a mindmap which a student can easily learn and understand:
{
  "name": "Main Topic",
  "children": [
    {
      "name": "Subtopic 1",
      "children": []
    }
  ]
}

Use the markdown content below to create the mind map structure. Extract the key concepts and their relationships:

${markdown}`;

      const response = await apiClient.chatCompletion(
        [
          {
            role: "system",
            content: "You are a mind map generator. Generate only valid JSON with no markdown formatting. The JSON should represent a hierarchical mind map structure with 'name' and 'children' properties.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        "gpt-4-turbo-2024-04-09",
        800
      );

      const parsedData = cleanAndParseJSON(response);
      if (!parsedData) {
        throw new Error("Failed to parse mind map structure");
      }
      return parsedData;

    } catch (error) {
      console.error("Error generating mind map structure:", error);
      // Return a basic structure as fallback
      return {
        name: "Content Overview",
        children: [
          {
            name: "Unable to generate structure",
            children: []
          }
        ]
      };
    }
  }, [apiClient]);

  const drawMindMap = useCallback((data, canvas, x, y, available_width, available_height) => {
    const ctx = canvas.getContext('2d');
    const NODE_HEIGHT = 40;
    const NODE_PADDING = 15;
    const LEVEL_SPACING = 80;
    const MIN_NODE_WIDTH = 120;

    ctx.font = 'bold 14px Arial';
    ctx.textBaseline = 'middle';

    const drawNode = (node, x, y, width) => {
      const textWidth = Math.max(ctx.measureText(node.name).width + NODE_PADDING * 2, MIN_NODE_WIDTH);
      const nodeWidth = Math.min(textWidth, width);

      // Draw connection lines first
      if (node.children && node.children.length > 0) {
        const childWidth = width / node.children.length;
        const startX = x - (width / 2);

        node.children.forEach((child, index) => {
          const childX = startX + (childWidth * (index + 0.5));
          const childY = y + LEVEL_SPACING;

          // Curved connection line
          ctx.strokeStyle = '#4b5563';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y + NODE_HEIGHT / 2);
          const controlPoint1X = x;
          const controlPoint1Y = y + LEVEL_SPACING / 3;
          const controlPoint2X = childX;
          const controlPoint2Y = childY - LEVEL_SPACING / 3;
          ctx.bezierCurveTo(
            controlPoint1X, controlPoint1Y,
            controlPoint2X, controlPoint2Y,
            childX, childY - NODE_HEIGHT / 2
          );
          ctx.stroke();

          drawNode(child, childX, childY, childWidth);
        });
      }

      // Draw node background with gradient
      const gradient = ctx.createLinearGradient(
        x - nodeWidth / 2,
        y - NODE_HEIGHT / 2,
        x - nodeWidth / 2,
        y + NODE_HEIGHT / 2
      );
      gradient.addColorStop(0, '#2563eb');
      gradient.addColorStop(1, '#1d4ed8');

      ctx.fillStyle = gradient;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
      ctx.beginPath();
      ctx.roundRect(x - nodeWidth / 2, y - NODE_HEIGHT / 2, nodeWidth, NODE_HEIGHT, 10);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      // Draw text
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';

      // Handle text wrapping
      const words = node.name.split(' ');
      let line = '';
      let lines = [];
      const maxWidth = nodeWidth - NODE_PADDING * 2;

      words.forEach(word => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== '') {
          lines.push(line);
          line = word + ' ';
        } else {
          line = testLine;
        }
      });
      lines.push(line);

      const lineHeight = 18;
      const totalHeight = lines.length * lineHeight;
      let startY = y - (totalHeight / 2) + (lineHeight / 2);

      lines.forEach(line => {
        ctx.fillText(line.trim(), x, startY, maxWidth);
        startY += lineHeight;
      });
    };

    // Clear canvas and draw the mind map
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawNode(data, x, y, available_width);
  }, []);

  useEffect(() => {
    const generateAndDraw = async () => {
      if (!markdown || !canvasRef.current) return;

      setIsLoading(true);
      const data = await generateMindMapStructure(markdown);
      setMindMapData(data);
      setIsLoading(false);
    };

    generateAndDraw();
  }, [markdown, generateMindMapStructure]);

  useEffect(() => {
    if (!mindMapData || !canvasRef.current) return;

    const canvas = canvasRef.current;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;

    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Draw mindmap
    drawMindMap(
      mindMapData,
      canvas,
      canvas.offsetWidth / 2,
      60,
      canvas.offsetWidth,
      canvas.offsetHeight
    );
  }, [mindMapData, drawMindMap]);

  return (
    <Card className="w-full h-full bg-gray-800 p-4 relative">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </Card>
  );
};

export default MindMap;
