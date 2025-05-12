# Architectural Proposal: GraphCanvas Refactor

## Problem Statement
There are two separate `GraphCanvas.tsx` files (`tardis-ui/src/components/GraphCanvas.tsx` and `tardis-ui/src/components/interactive/slope/components/GraphCanvas.tsx`). This leads to code duplication, maintenance overhead, and potential for inconsistent behavior or bug fixes.

## Proposed Solutions
### Solution 1: Unified `GraphCanvas` with Props
Create a single `GraphCanvas` component that accepts props to configure its behavior and appearance for different use cases (generic vs. interactive slope). Use conditional rendering or different internal logic based on these props. This approach keeps the component simple but can become complex if the differences between use cases are significant.

### Solution 2: `GraphCanvas` with Composition and Strategy Pattern
Create a core `GraphCanvas` component that handles basic canvas functionality. Use composition (e.g., children props) to add specific features for different use cases. Employ the Strategy pattern to encapsulate different drawing or interaction behaviors. This approach promotes modularity and extensibility but might introduce more abstraction.

### Trade-offs
| Criteria | Solution 1 (Unified with Props) | Solution 2 (Composition/Strategy) |
|----------|---------------------------------|-----------------------------------|
| Maintainability | Medium | High |
| Simplicity | High | Medium |
| Modularity | Medium | High |
| Testability | Medium | High |
| Scalability | Medium | High |

## UML Diagram
```mermaid
classDiagram
    class GraphCanvas {
        -props: any
        +render(): React.ReactNode
    }

    class CoreGraphCanvas {
      - canvasRef: RefObject<HTMLCanvasElement>
      + draw(strategy: DrawingStrategy): void
    }

    interface DrawingStrategy {
      +drawOnCanvas(canvas: HTMLCanvasElement): void
    }

    class GenericDrawingStrategy implements DrawingStrategy {
      +drawOnCanvas(canvas: HTMLCanvasElement): void
    }

    class SlopeDrawingStrategy implements DrawingStrategy {
      +drawOnCanvas(canvas: HTMLCanvasElement): void
    }

    CoreGraphCanvas "1" *--  "1" DrawingStrategy : uses
    DrawingStrategy <|.. GenericDrawingStrategy : implements
    DrawingStrategy <|.. SlopeDrawingStrategy : implements

    GraphCanvas --> CoreGraphCanvas : uses
```

## Architecture Decision Record
- Context: Two `GraphCanvas` implementations lead to code duplication, maintenance issues, and potential inconsistencies.
- Decision: Adopt Solution 2 (Composition and Strategy Pattern) to create a flexible and extensible `GraphCanvas` component.
- Consequences: Increased initial complexity but improved long-term maintainability, scalability, and testability.

## Recommended Solution
Solution 2 (Composition and Strategy Pattern) is the recommended solution because it promotes modularity, extensibility, and testability, which are crucial for long-term maintainability and scalability of the `GraphCanvas` component.