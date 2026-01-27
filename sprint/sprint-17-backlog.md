# Sprint 17 Backlog: Completion & Modernization

## Sprint Goal
Complete EP-011 Student Practice Module (word problems, animations, testing), finalize EP-012 UI/UX polish, modernize codebase, and establish testing infrastructure (EP-001).

## Sprint Details
- **Dates**: January 27 - February 10, 2026
- **Story Points**: 34
- **Team**: Full stack

## User Stories and Tasks

### 1. Complete Word Problem System (EP-011 Phase 3) - 10 points

#### 1.1 Word Problem Visualization (5 points)
- [ ] **WP-001**: Complete `WordProblem.tsx` - enhance SVG visualization generation
- [ ] **WP-002**: Implement `useWordProblemGenerator` - contextual math problem generation
- [ ] **WP-003**: Add difficulty progression system
- [ ] **WP-004**: Improve problem categorization and filtering
- [ ] **WP-005**: Add problem history tracking UI

#### 1.2 Animated Solutions (5 points)
- [ ] **AN-001**: Complete `AnimatedSolution.tsx` - dynamic SVG animations
- [ ] **AN-002**: Implement `useAnimationController` - animation timing management
- [ ] **AN-003**: Add playback controls (play, pause, scrub)
- [ ] **AN-004**: Optimize animation performance (60fps target)
- [ ] **AN-005**: Add animation presets for different problem types

### 2. Complete EP-012 UI/UX Polish - 8 points

#### 2.1 Tool Sidebar Enhancement (3 points)
- [ ] **UI-001**: Add tooltips for all tools
- [ ] **UI-002**: Implement keyboard shortcuts for common actions
- [ ] **UI-003**: Add visual feedback for all interactions
- [ ] **UI-004**: Improve undo/redo visualization

#### 2.2 Accessibility Implementation (5 points)
- [ ] **A11Y-001**: Add ARIA labels for all interactive elements
- [ ] **A11Y-002**: Implement keyboard navigation for canvas
- [ ] **A11Y-003**: Add screen reader support
- [ ] **A11Y-004**: Ensure proper focus management
- [ ] **A11Y-005**: Test with axe-core and fix issues

### 3. Testing Infrastructure (EP-001) - 8 points

#### 3.1 Unit Testing Setup (4 points)
- [ ] **TEST-001**: Configure Jest with TypeScript
- [ ] **TEST-002**: Set up React Testing Library
- [ ] **TEST-003**: Create test utilities and mocks
- [ ] **TEST-004**: Write tests for slope hooks (`useGraphManagement`, `useProblemGeneration`)
- [ ] **TEST-005**: Write tests for WordProblem component

#### 3.2 Component Testing (4 points)
- [ ] **TEST-006**: Write tests for GraphCanvas component
- [ ] **TEST-007**: Write tests for SlopeDrawing component
- [ ] **TEST-008**: Write tests for PracticeProblem component
- [ ] **TEST-009**: Add accessibility testing with jest-axe
- [ ] **TEST-010**: Set up CI pipeline for tests

### 4. Code Modernization & Cleanup - 8 points

#### 4.1 Remove `as any` Type Assertions (4 points)
- [ ] **CLEAN-001**: Fix type definitions in `unified-api-service.ts`
- [ ] **CLEAN-002**: Add proper types to API client calls
- [ ] **CLEAN-003**: Remove unnecessary type assertions in components
- [ ] **CLEAN-004**: Add ESLint rule to prevent new `as any` usages

#### 4.2 Simplify State Management (2 points)
- [ ] **CLEAN-005**: Remove redundant Context providers
- [ ] **CLEAN-006**: Consolidate similar hooks
- [ ] **CLEAN-007**: Remove unused props and imports

#### 4.3 Performance Optimization (2 points)
- [ ] **PERF-001**: Memoize expensive computations
- [ ] **PERF-002**: Optimize re-renders with React.memo
- [ ] **PERF-003**: Lazy load non-critical components

## Acceptance Criteria

### Word Problem System
- WordProblem component generates contextual problems with SVG visualizations
- AnimatedSolution plays smooth animations for problem solutions
- Difficulty progression increases challenge appropriately
- All animations maintain 60fps target

### EP-012 Polish Complete
- All tools have tooltips and keyboard shortcuts
- Full keyboard navigation for entire slope tool
- Screen reader can access all functionality
- WCAG 2.1 AA compliance achieved

### Testing Infrastructure
- Jest configured and running
- 70%+ test coverage for slope components
- All critical hooks tested
- CI pipeline runs tests on push

### Code Modernization
- No new `as any` type assertions without justification
- ESLint rule prevents `as any` in new code
- Removed unused code and imports
- Performance metrics improved

## Dependencies
- EP-011: Student Practice Module (parent)
- EP-012: Slope Drawing Tool Polish (in progress)
- EP-001: Test Framework Setup (being established)

## Notes
- Prioritize word problem completion for demo
- Accessibility is blocker for production release
- Testing enables confident refactoring

## Reference Documents
- [EP-011: Student Practice Module](../epics/student-practice-module.md)
- [EP-012: Slope Drawing Polish](../epics/slope-drawing-polish.md)
- [Sprint Schedule](sprint-schedule.md)
