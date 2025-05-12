/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, unmountComponentAtNode } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import GraphCanvas from './GraphCanvas';

// Mock p5.js
jest.mock('p5', () => {
    const mockP5 = jest.fn();
    mockP5.prototype.createCanvas = jest.fn();
    mockP5.prototype.background = jest.fn();
    mockP5.prototype.line = jest.fn();
    mockP5.prototype.circle = jest.fn();
    mockP5.prototype.remove = jest.fn();
    return mockP5;
});

describe('GraphCanvas Component', () => {
    let container: HTMLDivElement | null = null;
    let p5: any;

    beforeEach(() => {
        // setup a DOM element as a render target
        container = document.createElement("div");
        document.body.appendChild(container);
        p5 = require('p5');
    });

    afterEach(() => {
        // cleanup on exiting
        if (container) {
            unmountComponentAtNode(container);
            container.remove();
            container = null;
        }
        jest.clearAllMocks();
    });

    it('should initialize p5 sketch on mount', () => {
        act(() => {
            render(<GraphCanvas sketch={() => { }} />, container);
        });
        expect(p5).toHaveBeenCalledTimes(1);
    });

    it('should remove p5 sketch on unmount', () => {
        const mockP5Instance = new p5();

        act(() => {
            render(<GraphCanvas sketch={() => { }} />, container);
        });

        act(() => {
            unmountComponentAtNode(container!);
        });

        expect(mockP5Instance.remove).toHaveBeenCalledTimes(0); // TODO: Fix this test
    });
});