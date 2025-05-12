import React, { useMemo, useState, useCallback, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SvgDrawingStrategy } from './GraphCanvas/strategies/SvgDrawingStrategy';
import { Point, Line, Shape, Text, Offset } from '@/types/geometry';
import { InteractiveMathConfig } from '@/types/graph';
import { throttle } from 'lodash';

interface SvgGraphCanvasProps {
    width: number;
    height: number;
    drawingStrategy: SvgDrawingStrategy;
    points: Point[];
    lines: Line[];
    shapes: Shape[];
    texts: Text[];
    config?: InteractiveMathConfig;
    zoom?: number;
    offset?: Offset;
    onElementClick?: (type: string, index: number, data: any) => void;
    isMobileDevice?: boolean;
}

interface TooltipState {
    visible: boolean;
    content: string;
    x: number;
    y: number;
}

// Memoized shape component
const ShapeElement = memo<{
    shape: Shape;
    index: number;
    onMouseEnter: (e: React.MouseEvent<SVGElement>, index: number) => void;
    onTouchStart: (e: React.TouchEvent<SVGElement>, index: number) => void;
    onMouseLeave: () => void;
    onClick: (index: number) => void;
}>(({ shape, index, onMouseEnter, onTouchStart, onMouseLeave, onClick }) => {
    const handleMouseEnter = useCallback((e: React.MouseEvent<SVGElement>) => {
        onMouseEnter(e, index);
    }, [onMouseEnter, index]);

    const handleTouchStart = useCallback((e: React.TouchEvent<SVGElement>) => {
        onTouchStart(e, index);
    }, [onTouchStart, index]);

    const handleClick = useCallback(() => {
        onClick(index);
    }, [onClick, index]);

    if (shape.type === 'rectangle' && shape.topLeft && shape.bottomRight) {
        return (
            <motion.rect
                initial={{ opacity: 0 }}
                animate={{ opacity: typeof shape.opacity === 'number' ? shape.opacity : 1 }}
                transition={{ duration: 0.2 }}
                x={shape.topLeft.x}
                y={shape.topLeft.y}
                width={shape.bottomRight.x - shape.topLeft.x}
                height={shape.bottomRight.y - shape.topLeft.y}
                fill={shape.fill || "rgba(200, 200, 200, 0.5)"}
                stroke={shape.stroke || "gray"}
                strokeWidth={shape.strokeWidth || 1}
                onMouseEnter={handleMouseEnter}
                onTouchStart={handleTouchStart}
                onMouseLeave={onMouseLeave}
                onClick={handleClick}
                onTouchEnd={(e) => {
                    e.preventDefault();
                    handleClick();
                    onMouseLeave();
                }}
                style={{
                    cursor: 'pointer',
                    touchAction: 'none'
                }}
            />
        );
    }

    if (shape.type === 'circle' && shape.center && shape.radius) {
        return (
            <motion.circle
                initial={{ opacity: 0 }}
                animate={{ opacity: typeof shape.opacity === 'number' ? shape.opacity : 1 }}
                transition={{ duration: 0.2 }}
                cx={shape.center.x}
                cy={shape.center.y}
                r={shape.radius}
                fill={shape.fill || "rgba(200, 200, 200, 0.5)"}
                stroke={shape.stroke || "gray"}
                strokeWidth={shape.strokeWidth || 1}
                onMouseEnter={handleMouseEnter}
                onTouchStart={handleTouchStart}
                onMouseLeave={onMouseLeave}
                onClick={handleClick}
                onTouchEnd={(e) => {
                    e.preventDefault();
                    handleClick();
                    onMouseLeave();
                }}
                style={{
                    cursor: 'pointer',
                    touchAction: 'none'
                }}
            />
        );
    }

    return null;
});

// Memoized line component
const LineElement = memo<{
    line: Line;
    index: number;
    onMouseEnter: (e: React.MouseEvent<SVGElement>, index: number) => void;
    onTouchStart: (e: React.TouchEvent<SVGElement>, index: number) => void;
    onMouseLeave: () => void;
    onClick: (index: number) => void;
}>(({ line, index, onMouseEnter, onTouchStart, onMouseLeave, onClick }) => {
    const handleMouseEnter = useCallback((e: React.MouseEvent<SVGElement>) => {
        onMouseEnter(e, index);
    }, [onMouseEnter, index]);

    const handleTouchStart = useCallback((e: React.TouchEvent<SVGElement>) => {
        onTouchStart(e, index);
    }, [onTouchStart, index]);

    const handleClick = useCallback(() => {
        onClick(index);
    }, [onClick, index]);

    return (
        <motion.line
            initial={{ opacity: 0 }}
            animate={{ opacity: typeof line.opacity === 'number' ? line.opacity : 1 }}
            transition={{ duration: 0.2 }}
            x1={line.start.x}
            y1={line.start.y}
            x2={line.end.x}
            y2={line.end.y}
            stroke={line.color || "blue"}
            strokeWidth={line.strokeWidth || 2}
            vectorEffect="non-scaling-stroke"
            onMouseEnter={handleMouseEnter}
            onTouchStart={handleTouchStart}
            onMouseLeave={onMouseLeave}
            onClick={handleClick}
            onTouchEnd={(e) => {
                e.preventDefault();
                handleClick();
                onMouseLeave();
            }}
            style={{
                cursor: 'pointer',
                touchAction: 'none'
            }}
        />
    );
});

// Memoized point component
const PointElement = memo<{
    point: Point;
    index: number;
    onMouseEnter: (e: React.MouseEvent<SVGElement>, index: number) => void;
    onTouchStart: (e: React.TouchEvent<SVGElement>, index: number) => void;
    onMouseLeave: () => void;
    onClick: (index: number) => void;
}>(({ point, index, onMouseEnter, onTouchStart, onMouseLeave, onClick }) => {
    const handleMouseEnter = useCallback((e: React.MouseEvent<SVGElement>) => {
        onMouseEnter(e, index);
    }, [onMouseEnter, index]);

    const handleTouchStart = useCallback((e: React.TouchEvent<SVGElement>) => {
        onTouchStart(e, index);
    }, [onTouchStart, index]);

    const handleClick = useCallback(() => {
        onClick(index);
    }, [onClick, index]);

    return (
        <motion.circle
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            cx={point.x}
            cy={point.y}
            r={5}
            fill="red"
            stroke="white"
            strokeWidth={1}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={(e) => {
                e.preventDefault();
                handleClick();
                onMouseLeave();
            }}
            style={{
                cursor: 'pointer',
                touchAction: 'none'
            }}
        />
    );
});

// Memoized text component
const TextElement = memo<{
    text: Text;
    index: number;
    onMouseEnter: (e: React.MouseEvent<SVGElement>, index: number) => void;
    onTouchStart: (e: React.TouchEvent<SVGElement>, index: number) => void;
    onMouseLeave: () => void;
    onClick: (index: number) => void;
}>(({ text, index, onMouseEnter, onTouchStart, onMouseLeave, onClick }) => {
    const handleMouseEnter = useCallback((e: React.MouseEvent<SVGElement>) => {
        onMouseEnter(e, index);
    }, [onMouseEnter, index]);

    const handleTouchStart = useCallback((e: React.TouchEvent<SVGElement>) => {
        onTouchStart(e, index);
    }, [onTouchStart, index]);

    const handleClick = useCallback(() => {
        onClick(index);
    }, [onClick, index]);

    return (
        <motion.text
            initial={{ opacity: 0 }}
            animate={{ opacity: typeof text.opacity === 'number' ? text.opacity : 1 }}
            transition={{ duration: 0.2 }}
            x={text.position.x}
            y={text.position.y}
            fill={text.color || "black"}
            fontFamily={text.fontFamily || "Arial"}
            fontSize={text.fontSize || "14px"}
            textAnchor="middle"
            dominantBaseline="middle"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={(e) => {
                e.preventDefault();
                handleClick();
                onMouseLeave();
            }}
            style={{
                cursor: 'pointer',
                touchAction: 'none'
            }}
        >
            {text.text}
        </motion.text>
    );
});

const handleTouch = (e: React.TouchEvent<SVGElement>, rect: DOMRect): { x: number; y: number } => {
    const touch = e.touches[0];
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    return {
        x: touch.clientX,
        y: touch.clientY - (isMobile ? 60 : 40)
    };
};

const handleMouse = (rect: DOMRect): { x: number; y: number } => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const scaleFactor = isMobile ? 1.5 : 1;
    return {
        x: rect.left + (rect.width * scaleFactor) / 2,
        y: rect.top - (isMobile ? 44 : 0)
    };
};

const SvgGraphCanvas: React.FC<SvgGraphCanvasProps> = ({
    width,
    height,
    drawingStrategy,
    points,
    lines,
    shapes,
    texts,
    config,
    zoom = 1,
    offset = { x: 0, y: 0 },
    onElementClick
}) => {
    // Using useRef to avoid unnecessary re-renders of tooltip state
    const tooltipRef = useRef<TooltipState>({
        visible: false,
        content: '',
        x: 0,
        y: 0
    });
    const [tooltipState, setTooltipState] = useState<TooltipState>(tooltipRef.current);

    // Throttle tooltip updates to reduce performance impact
    const updateTooltip = useCallback(
        throttle((newState: TooltipState) => {
            tooltipRef.current = newState;
            setTooltipState(newState);
        }, 50),
        []
    );

    // Handler for mouse tooltips
    const handleElementMouse = useCallback((e: React.MouseEvent<SVGElement>, type: string, idx: number): void => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = handleMouse(rect);
        updateTooltip({
            visible: true,
            content: `${type} ${idx + 1}`,
            x: pos.x,
            y: pos.y
        });
    }, [updateTooltip]);

    // Handler for touch tooltips
    const handleElementTouch = useCallback((e: React.TouchEvent<SVGElement>, type: string, idx: number): void => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = handleTouch(e, rect);
        updateTooltip({
            visible: true,
            content: `${type} ${idx + 1}`,
            x: pos.x,
            y: pos.y
        });
    }, [updateTooltip]);

    // Create viewBox to center the content
    const viewBox = useMemo(() => {
        const centerX = width / 2;
        const centerY = height / 2;
        return `${-centerX} ${-centerY} ${width} ${height}`;
    }, [width, height]);

    const handleMouseLeave = useCallback(() => {
        updateTooltip({ ...tooltipRef.current, visible: false });
    }, [updateTooltip]);

    const svgContent = useMemo(() => {
        return drawingStrategy.renderSvg({
            points,
            lines,
            shapes,
            texts,
            config,
            zoom,
            offset,
        });
    }, [drawingStrategy, points, lines, shapes, texts, config, zoom, offset]);

    // CSS styles for mobile optimization
    const mobileStyles = {
        '--touch-target-size': '44px',
        '--tooltip-offset': '20px',
    } as React.CSSProperties;

    // Handler for touch event tooltips
    const handleTooltipTouch = useCallback((e: React.TouchEvent<SVGElement>, type: string, idx: number, data: any) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = handleTouch(e, rect);
        updateTooltip({
            visible: true,
            content: `${type} ${idx + 1}`,
            x: pos.x,
            y: pos.y
        });
    }, [updateTooltip]);

    // Handler for mouse event tooltips
    const handleTooltipMouse = useCallback((e: React.MouseEvent<SVGElement>, type: string, idx: number) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = handleMouse(rect);
        updateTooltip({
            visible: true,
            content: `${type} ${idx + 1}`,
            x: pos.x,
            y: pos.y
        });
    }, [updateTooltip]);

    return (
        <motion.svg
            width={width}
            height={height}
            viewBox={viewBox}
            style={{
                background: 'white',
                ...(window.matchMedia('(max-width: 768px)').matches ? mobileStyles : {})
            }}
            preserveAspectRatio="xMidYMid meet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onTouchStart={(e) => e.preventDefault()}
        >
            <motion.g transform={`translate(${width / 2},${height / 2})`}>
                {shapes.map((shape, index) => (
                    <ShapeElement
                        key={`shape-${index}`}
                        shape={shape}
                        index={index}
                        onMouseEnter={(e, idx) => handleElementMouse(e, shape.type, idx)}
                        onTouchStart={(e, idx) => handleElementTouch(e, shape.type, idx)}
                        onMouseLeave={handleMouseLeave}
                        onClick={(idx) => onElementClick?.('shape', idx, shape)}
                    />
                ))}

                {lines.map((line, index) => (
                    <LineElement
                        key={`line-${index}`}
                        line={line}
                        index={index}
                        onMouseEnter={(e, idx) => handleElementMouse(e, 'Line', idx)}
                        onTouchStart={(e, idx) => handleElementTouch(e, 'Line', idx)}
                        onMouseLeave={handleMouseLeave}
                        onClick={(idx) => onElementClick?.('line', idx, line)}
                    />
                ))}

                {points.map((point, index) => (
                    <PointElement
                        key={`point-${index}`}
                        point={point}
                        index={index}
                        onMouseEnter={(e, idx) => handleElementMouse(e, 'Point', idx)}
                        onTouchStart={(e, idx) => handleElementTouch(e, 'Point', idx)}
                        onMouseLeave={handleMouseLeave}
                        onClick={(idx) => onElementClick?.('point', idx, point)}
                    />
                ))}

                {texts.map((text, index) => (
                    <TextElement
                        key={`text-${index}`}
                        text={text}
                        index={index}
                        onMouseEnter={(e, idx) => handleElementMouse(e, 'Text', idx)}
                        onTouchStart={(e, idx) => handleElementTouch(e, 'Text', idx)}
                        onMouseLeave={handleMouseLeave}
                        onClick={(idx) => onElementClick?.('text', idx, text)}
                    />
                ))}

                {lines.map((line, index) => (
                    <LineElement
                        key={`line-${index}`}
                        line={line}
                        index={index}
                        onMouseEnter={(e, idx) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const pos = handleMouse(rect);
                            updateTooltip({
                                visible: true,
                                content: `Line ${idx + 1}`,
                                x: pos.x,
                                y: pos.y
                            });
                        }}
                        onTouchStart={(e, idx) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const pos = handleTouch(e, rect);
                            updateTooltip({
                                visible: true,
                                content: `Line ${idx + 1}`,
                                x: pos.x,
                                y: pos.y
                            });
                        }}
                        onMouseLeave={handleMouseLeave}
                        onClick={(idx) => onElementClick?.('line', idx, line)}
                    />
                ))}

                {points.map((point, index) => (
                    <PointElement
                        key={`point-${index}`}
                        point={point}
                        index={index}
                        onMouseEnter={(e, idx) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const pos = handleMouse(rect);
                            updateTooltip({
                                visible: true,
                                content: `Point ${idx + 1}`,
                                x: pos.x,
                                y: pos.y
                            });
                        }}
                        onTouchStart={(e, idx) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const pos = handleTouch(e, rect);
                            updateTooltip({
                                visible: true,
                                content: `Point ${idx + 1}`,
                                x: pos.x,
                                y: pos.y
                            });
                        }}
                        onMouseLeave={handleMouseLeave}
                        onClick={(idx) => onElementClick?.('point', idx, point)}
                    />
                ))}

                {texts.map((text, index) => (
                    <TextElement
                        key={`text-${index}`}
                        text={text}
                        index={index}
                        onMouseEnter={(e, idx) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const pos = handleMouse(rect);
                            updateTooltip({
                                visible: true,
                                content: `Text ${idx + 1}`,
                                x: pos.x,
                                y: pos.y
                            });
                        }}
                        onTouchStart={(e, idx) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const pos = handleTouch(e, rect);
                            updateTooltip({
                                visible: true,
                                content: `Text ${idx + 1}`,
                                x: pos.x,
                                y: pos.y
                            });
                        }}
                        onMouseLeave={handleMouseLeave}
                        onClick={(idx) => onElementClick?.('text', idx, text)}
                    />
                ))}
            </motion.g>
                    <ShapeElement
                        key={`shape-${index}`}
                        shape={shape}
                        index={index}
                        onMouseEnter={(e, idx) => {
                            const touchOrMouseEvent = e.touches ? e.touches[0] : e;
                            const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
                            const isMobile = window.matchMedia('(max-width: 768px)').matches;
                            const scaleFactor = isMobile ? 1.5 : 1;

                            let tooltipX = rect.left + (rect.width * scaleFactor) / 2;
                            let tooltipY = rect.top - (isMobile ? 44 : 0);

                            // Adjust position for touch events
                            if ('touches' in e) {
                                const touch = e.touches[0];
                                tooltipX = touch.clientX;
                                tooltipY = touch.clientY - (isMobile ? 60 : 40);
                            }

                            updateTooltip({
                                visible: true,
                                content: `${shape.type} ${idx + 1}`,
                                x: tooltipX,
                                y: tooltipY
                            });
                        }}
                        onMouseLeave={handleMouseLeave}
                        onClick={(idx) => onElementClick?.('shape', idx, shape)}
                    />
                ))}

                {lines.map((line, index) => (
                    <LineElement
                        key={`line-${index}`}
                        line={line}
                        index={index}
                        onMouseEnter={(e, idx) => {
                            const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
                            updateTooltip({
                                visible: true,
                                content: `Line ${idx + 1}`,
                                x: rect.left + rect.width / 2,
                                y: rect.top
                            });
                        }}
                        onMouseLeave={handleMouseLeave}
                        onClick={(idx) => onElementClick?.('line', idx, line)}
                    />
                ))}

                {points.map((point, index) => (
                    <PointElement
                        key={`point-${index}`}
                        point={point}
                        index={index}
                        onMouseEnter={(e, idx) => {
                            const rect = (e.target as SVGElement).getBoundingClientRect();
                            updateTooltip({
                                visible: true,
                                content: `Point (${point.x}, ${point.y})`,
                                x: rect.left + rect.width / 2,
                                y: rect.top
                            });
                        }}
                        onMouseLeave={handleMouseLeave}
                        onClick={(idx) => onElementClick?.('point', idx, point)}
                    />
                ))}

                {texts.map((text, index) => (
                    <TextElement
                        key={`text-${index}`}
                        text={text}
                        index={index}
                        onMouseEnter={(e, idx) => {
                            const rect = (e.target as SVGElement).getBoundingClientRect();
                            updateTooltip({
                                visible: true,
                                content: text.text,
                                x: rect.left + rect.width / 2,
                                y: rect.top
                            });
                        }}
                        onMouseLeave={handleMouseLeave}
                        onClick={(idx) => onElementClick?.('text', idx, text)}
                    />
                ))}
            </motion.g>

            <AnimatePresence>
                {tooltipState.visible && (
                    <motion.foreignObject
                        x={tooltipState.x - 50}
                        y={tooltipState.y - 30}
                        width="100"
                        height="30"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        style={{
                            pointerEvents: 'none',
                            overflow: 'visible'
                        }}
                    >
                        <div style={{
                            background: 'rgba(0, 0, 0, 0.8)',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            textAlign: 'center',
                            whiteSpace: 'nowrap'
                        }}>
                            {tooltipState.content}
                        </div>
                    </motion.foreignObject>
                )}
            </AnimatePresence>
        </motion.svg >
    );
};

export default SvgGraphCanvas;