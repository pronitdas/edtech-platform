# Update Frontend Video Player to Support Chapter Navigation

## Description
Enhance the VideoPlayer component to support chapter navigation using timestamps from the backend. The UI should allow users to jump to specific chapters and see chapter information during video playback.

## Technical Requirements
1. Update the VideoPlayer component to accept chapter data with timestamps
2. Create a CourseViewer component that combines VideoPlayer with chapter navigation
3. Implement visual indicators for chapters in the video timeline
4. Highlight the currently active chapter during playback

## Implementation Details

### VideoPlayer Component Updates
- Extend TimelineMarker interface to include chapter metadata
- Update marker rendering to show special indicators for LaTeX, code, and roleplay content
- Enhance the marker click handler to include full marker data

### New CourseViewer Component
Create a new component with:
- Video player on the left/top
- Chapter navigation sidebar
- Currently active chapter content display
- Course information section

### User Interactions
Implement these interactions:
- Click on chapter in sidebar → Jump to timestamp in video
- Video playback progress → Highlight active chapter in sidebar
- Hover over timeline marker → Show chapter title tooltip

### UI Design
Based on interface31.html, implement:
- Timeline with colored markers for different chapter types
- Chapter sidebar with clear hierarchy
- Special icons for chapters with LaTeX, code, or roleplay content

## Acceptance Criteria
- [ ] Users can navigate to specific chapters by clicking in the sidebar
- [ ] Currently playing chapter is visually highlighted
- [ ] Chapter content is displayed alongside the video
- [ ] Timeline shows markers for all chapters
- [ ] Special content types (LaTeX, code, roleplay) are visually indicated 