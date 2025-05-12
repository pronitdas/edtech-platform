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

## Duplicate Interface Definitions (Technical Debt)

// The following interfaces are defined in multiple places, leading to maintenance and type safety issues. These should be deduplicated and moved to a shared types module.

- **Point**
  - `tardis-ui/src/components/interactive/slope/types/index.ts`
  - `tardis-ui/src/components/interactive/slope/components/GraphCanvas.tsx`
  - `tardis-ui/src/components/GraphCanvas.tsx`
  // Comment: Core geometric type. Should be defined once in a shared types file and imported everywhere.

- **CustomShape**
  - `tardis-ui/src/components/GraphCanvas.tsx`
  - `tardis-ui/src/components/interactive/slope/components/GraphCanvas.tsx`
  // Comment: Used for drawing shapes. Should be unified and shared.

- **Offset**
  - `tardis-ui/src/components/interactive/slope/types/index.ts`
  - `tardis-ui/src/components/GraphCanvas.tsx`
  // Comment: Used for canvas panning/offset. Should be defined once and reused.


- **LineData**
  - `tardis-ui/src/components/interactive/slope/types/index.ts`
  - `tardis-ui/src/components/interactive/slope/components/PracticeProblem.tsx`
  // Comment: Represents a line in geometry. Should be defined once and reused.

- **Concept**
  - `tardis-ui/src/components/interactive/slope/types/index.ts`
  - `tardis-ui/src/components/interactive/slope/components/ConceptExplanation.tsx`
  // Comment: Represents a math/learning concept. Should be unified for consistency.

- **ProblemData**
  - `tardis-ui/src/components/interactive/slope/components/PracticeProblem.tsx`
  - `tardis-ui/src/components/interactive/slope/hooks/useProblemGeneration.ts`
  // Comment: Represents problem data for exercises. Should be deduplicated and shared.

// Action: Audit all usages, consolidate each interface into a single source of truth, and update imports throughout the codebase.
