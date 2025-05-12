# Architectural Proposal: GraphCanvas Refactor

## Problem Statement

There are two `GraphCanvas.tsx` components in the project:

*   [`tardis-ui/src/components/GraphCanvas.tsx`](tardis-ui/src/components/GraphCanvas.tsx): A generic graph canvas component.
*   [`tardis-ui/src/components/interactive/slope/components/GraphCanvas.tsx`](tardis-ui/src/components/interactive/slope/components/GraphCanvas.tsx): A specialized graph canvas component for slope drawing.

These components share common logic for p5 setup, drawing loop, and interactive features, but also have distinct drawing logic. This duplication leads to code smells and maintainability issues.

## Proposed Solutions

### Solution 1: Composition and Strategy Pattern

This solution proposes refactoring the two `GraphCanvas` components into a single, more flexible component using the Composition and Strategy patterns.

*   **CoreGraphCanvas:** A core component that handles the common p5 setup, drawing loop, and interactive features (panning, zooming, basic point manipulation).
*   **DrawingStrategy:** An interface that defines the method(s) for drawing specific content on the canvas.
*   **Concrete DrawingStrategy implementations:**
    *   `GenericDrawingStrategy`: Handles the generic drawing logic (using `p5Setup` and `p5Drawing` props) and potentially the mathematical function drawing.
    *   `SlopeDrawingStrategy`: Handles drawing the custom points, lines, shapes, and texts, and integrates with the interactive drawing tools and undo/redo logic.
*   **GraphCanvas:** The main component that orchestrates `CoreGraphCanvas` and the selected `DrawingStrategy` based on props.

### Solution 2: Monolithic Component

This solution proposes merging the two `GraphCanvas` components into a single, monolithic component with conditional rendering logic for different drawing modes.

## Trade-offs

| Criteria | Solution 1: Composition and Strategy | Solution 2: Monolithic Component |
|----------|---------------------------------------|-----------------------------------|
| Maintainability | High: Easier to maintain and extend with new drawing strategies. | Low: Complex conditional logic makes it harder to maintain and extend. |
| Simplicity | Medium: Requires understanding of the Composition and Strategy patterns. | High: Simpler to understand initially, but becomes complex as features are added. |
| Modularity | High: Clear separation of concerns between core canvas logic and drawing strategies. | Low: Tight coupling between core canvas logic and drawing logic. |
| Testability | High: Drawing strategies can be tested independently. | Low: Harder to test due to complex conditional logic. |
| Scalability | High: New drawing strategies can be added without modifying the core canvas component. | Low: Adding new features may require modifying the core component, leading to potential conflicts. |

## UML Diagram

```mermaid
classDiagram
    class GraphCanvas {
        -drawingStrategy: DrawingStrategy
        +render()
    }
    class CoreGraphCanvas {
        +p5Setup()
        +p5Drawing()
        +handleZoom()
        +handlePan()
    }
    interface DrawingStrategy {
        +draw(p5: p5Instance)
    }
    class GenericDrawingStrategy {
        +draw(p5: p5Instance)
    }
    class SlopeDrawingStrategy {
        +draw(p5: p5Instance)
    }

    GraphCanvas -- CoreGraphCanvas : uses
    GraphCanvas -- DrawingStrategy : uses
    DrawingStrategy <|.. GenericDrawingStrategy : implements
    DrawingStrategy <|.. SlopeDrawingStrategy : implements
```

## Architecture Decision Record

- Context: There are two `GraphCanvas` components with duplicated logic.
- Decision: Use the Composition and Strategy patterns to refactor the components into a single, more flexible component.
- Consequences: Improved maintainability, simplicity, modularity, testability, and scalability.

## Recommended Solution

I recommend **Solution 1: Composition and Strategy Pattern** because it provides better maintainability, modularity, testability, and scalability compared to the monolithic component approach. The Composition and Strategy patterns allow for a clear separation of concerns and make it easier to add new drawing strategies in the future.