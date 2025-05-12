# Tech Debt Items

## Redundant GraphCanvas Implementations and Related Issues

- **Redundancy**: There are two separate `GraphCanvas.tsx` files (`tardis-ui/src/components/GraphCanvas.tsx` and `tardis-ui/src/components/interactive/slope/components/GraphCanvas.tsx`). This leads to code duplication, maintenance overhead, and potential for inconsistent behavior or bug fixes.
- **Scalability**: Having multiple implementations of a core component like `GraphCanvas` makes it difficult to scale improvements, refactorings, or bug fixes across the codebase. Any enhancement or fix must be applied to both files, increasing the risk of divergence.
- **Visual/Layout Issues**: The two implementations may have different visual styles, layouts, or feature sets, leading to inconsistent user experiences. For example, the slope interactive version is highly customized for math drawing, while the generic version is a simple p5 wrapper. This can cause confusion for both users and developers.
- **Maintainability**: The current structure makes it hard to share improvements or bug fixes. It also increases onboarding time for new developers who must understand which `GraphCanvas` to use in which context.
- **Action Items**:
  - Audit all usages of both `GraphCanvas` components (including in `SlopeDrawing.tsx`).
  - Refactor to create a single, flexible, and extensible `GraphCanvas` component that can support both generic and interactive use cases via props or composition.
  - Ensure visual and layout consistency across all usages.
  - Remove the redundant implementation after migration.
- **Audit Findings:**
    - **Usages of [`tardis-ui/src/components/GraphCanvas.tsx`](tardis-ui/src/components/GraphCanvas.tsx):**
        - Imported and used in:
            - [`tardis-ui/src/components/GraphCanvas.stories.tsx`](tardis-ui/src/components/GraphCanvas.stories.tsx)
            - [`tardis-ui/src/components/GraphCanvas.test.tsx`](tardis-ui/src/components/GraphCanvas.test.tsx)
    - **Usages of [`tardis-ui/src/components/interactive/slope/components/GraphCanvas.tsx`](tardis-ui/src/components/interactive/slope/components/GraphCanvas.tsx):**
        - Imported and used in:
            - [`tardis-ui/src/components/interactive/slope/stories/GraphCanvas.stories.tsx`](tardis-ui/src/components/interactive/slope/stories/GraphCanvas.stories.tsx)
            - [`tardis-ui/src/components/interactive/slope/components/SlopeDrawingLayout.tsx`](tardis-ui/src/components/interactive/slope/components/SlopeDrawingLayout.tsx)

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