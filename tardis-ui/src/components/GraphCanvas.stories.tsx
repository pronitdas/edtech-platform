import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import GraphCanvas from './GraphCanvas';
import p5 from 'p5';

export default {
    title: 'Components/GraphCanvas',
    component: GraphCanvas,
} as Meta<typeof GraphCanvas>;

const Template: StoryFn<typeof GraphCanvas> = (args) => <GraphCanvas {...args} />;

export const SimpleLineGraph = Template.bind({});
SimpleLineGraph.args = {
    drawingMode: 'generic',
    p5Setup: (p: p5) => {
        p.createCanvas(400, 200);
        p.background(220);
    },
    p5Drawing: (p: p5) => {
        p.strokeWeight(2);
        p.noFill();
        p.beginShape();
        for (let x = 0; x <= p.width; x += 20) {
            let y = p.map(p.sin(x / 50), -1, 1, 20, p.height - 20);
            p.vertex(x, y);
        }
        p.endShape();
    },
};

export const BarChart = Template.bind({});
BarChart.args = {
    drawingMode: 'generic',
    p5Setup: (p: p5) => {
        p.createCanvas(400, 200);
        p.background(220);
    },
    p5Drawing: (p: p5) => {
        const data = [30, 70, 10, 90, 50];
        const barWidth = p.width / data.length;

        for (let i = 0; i < data.length; i++) {
            const barHeight = p.map(data[i], 0, 100, 0, p.height);
            const x = i * barWidth;
            const y = p.height - barHeight;

            p.fill(100);
            p.rect(x, y, barWidth, barHeight);
        }
    },
};

export const ScatterPlot = Template.bind({});
ScatterPlot.args = {
    drawingMode: 'generic',
    p5Setup: (p: p5) => {
        p.createCanvas(400, 200);
        p.background(220);
    },
    p5Drawing: (p: p5) => {
        p.strokeWeight(8);
        for (let i = 0; i < 50; i++) {
            let x = p.random(p.width);
            let y = p.random(p.height);
            p.point(x, y);
        }
    },
};