import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import GraphCanvas from './GraphCanvas'
import { Point, Offset, Line, Shape, Text } from '@/types/geometry'

describe('GraphCanvas', () => {
  const defaultProps = {
    width: 400,
    height: 400,
    zoom: 1,
    offset: { x: 0, y: 0 } as Offset,
    onZoomChange: jest.fn(),
    onOffsetChange: jest.fn(),
    mapPointToCanvas: (point: Point): Point => ({
      x: point.x * 50 + 200,
      y: 200 - point.y * 50,
    }),
    mapCanvasToPoint: (point: { x: number; y: number }): Point => ({
      x: (point.x - 200) / 50,
      y: (200 - point.y) / 50,
    }),
  }

  describe('SVG Mode', () => {
    it('handles element clicks in SVG mode', () => {
      const onElementClick = jest.fn()
      const points = [{ x: 0, y: 0 }]
      const lines = [{ start: { x: -1, y: -1 }, end: { x: 1, y: 1 } }]
      const shapes = [
        {
          type: 'rectangle' as const,
          topLeft: { x: -1, y: -1 },
          bottomRight: { x: 1, y: 1 },
        },
      ]
      const texts = [{ text: 'Test', position: { x: 0, y: 0 } }]

      render(
        <GraphCanvas
          {...defaultProps}
          renderingMode='svg'
          points={points}
          lines={lines}
          shapes={shapes}
          texts={texts}
          onElementClick={onElementClick}
        />
      )

      // Test point interaction
      const point = screen.getByRole('presentation').querySelector('circle')
      if (point) {
        fireEvent.click(point)
        expect(onElementClick).toHaveBeenCalledWith('point', 0, points[0])
      }

      // Test line interaction
      const line = screen.getByRole('presentation').querySelector('line')
      if (line) {
        fireEvent.click(line)
        expect(onElementClick).toHaveBeenCalledWith('line', 0, lines[0])
      }

      // Test text interaction
      const text = screen.getByRole('presentation').querySelector('text')
      if (text) {
        fireEvent.click(text)
        expect(onElementClick).toHaveBeenCalledWith('text', 0, texts[0])
      }
    })

    it('shows tooltips on hover in SVG mode', () => {
      const points = [{ x: 0, y: 0 }]
      const lines: Line[] = []
      const shapes: Shape[] = []
      const texts: Text[] = [
        {
          text: 'Test',
          position: { x: 0, y: 0 },
        },
      ]

      render(
        <GraphCanvas
          {...defaultProps}
          renderingMode='svg'
          points={points}
          lines={lines}
          shapes={shapes}
          texts={texts}
        />
      )

      const point = screen.getByRole('presentation').querySelector('circle')
      if (point) {
        fireEvent.mouseEnter(point)
        expect(screen.getByText('Point (0, 0)')).toBeInTheDocument()

        fireEvent.mouseLeave(point)
        expect(screen.queryByText('Point (0, 0)')).not.toBeInTheDocument()
      }
    })
  })

  describe('P5 Mode', () => {
    it('initializes p5 canvas in slope mode', () => {
      render(
        <GraphCanvas
          {...defaultProps}
          renderingMode='p5'
          drawingMode='slope'
          points={[]}
          customPoints={[]}
          customLines={[]}
          shapes={[]}
          texts={[]}
          drawingTool='point'
          editMode={true}
          highlightSolution={false}
          slopeConfig={{
            equation: 'x',
            xRange: [-5, 5],
            yRange: [-5, 5],
            stepSize: 0.1,
          }}
          onPointsChange={() => {}}
          onDrawingToolChange={() => {}}
          selectedItem={null}
          setSelectedItem={() => {}}
          undoStack={[]}
          setUndoStack={() => {}}
          redoStack={[]}
          setRedoStack={() => {}}
        />
      )

      // Verify the canvas container is rendered
      expect(screen.getByRole('presentation')).toBeInTheDocument()
    })

    it('handles zoom and pan in P5 mode', () => {
      const onZoomChange = jest.fn()
      const onOffsetChange = jest.fn()

      render(
        <GraphCanvas
          {...defaultProps}
          renderingMode='p5'
          drawingMode='generic'
          onZoomChange={onZoomChange}
          onOffsetChange={onOffsetChange}
          p5Setup={() => {}}
          p5Drawing={() => {}}
        />
      )

      const canvas = screen.getByRole('presentation')

      // Test zoom
      fireEvent.wheel(canvas, { deltaY: -100 })
      expect(onZoomChange).toHaveBeenCalled()

      // Test pan
      fireEvent.mouseDown(canvas)
      fireEvent.mouseMove(canvas, { clientX: 50, clientY: 50 })
      fireEvent.mouseUp(canvas)
      expect(onOffsetChange).toHaveBeenCalled()
    })
  })
})
