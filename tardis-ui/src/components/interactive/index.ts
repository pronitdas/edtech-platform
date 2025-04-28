// This file will export all interactive components from the interactive folder
// As we implement each component, we'll add it to the exports

// Core Components - Comment out until they're fully implemented
export { default as SlopeDrawing } from './slope/SlopeDrawing';

// This will allow convenient imports like:
// import { SlopeDrawing } from '@/components/interactive';

// For now, just export the types and placeholder for structure setup
export const InteractiveComponentTypes = {
  SLOPE_DRAWER: 'slope-drawer',
  EQUATION_SOLVER: 'equation-solver',
  GRAPH_PLOTTER: 'graph-plotter',
};

// Remove the placeholder export since we're using the real component now
// export { default as SlopeDrawingPlaceholder } from './slope/SlopeDrawing'; 