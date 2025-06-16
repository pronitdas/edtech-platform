/**
 * File Structure Documentation
 *
 * This file documents duplicate and inconsistent file structures that need to be addressed.
 */

export const fileStructureIssues = {
  uiComponents: {
    card: {
      duplicates: ['src/components/ui/Card.tsx', 'src/components/ui/card.tsx'],
      recommendation:
        'Consolidate into a single Card.tsx following PascalCase convention',
    },
    dialog: {
      duplicates: [
        'src/components/ui/Dialog.tsx',
        'src/components/ui/dialog.tsx',
      ],
      recommendation:
        'Consolidate into a single Dialog.tsx following PascalCase convention',
    },
  },
  videoPlayer: {
    duplicates: [
      'src/components/VideoPlayer.tsx',
      'src/components/video/VideoPlayer.tsx',
      'src/components/video/ModernVideoPlayer.tsx',
    ],
    recommendation:
      'Consolidate video player implementations into src/components/video directory. Consider keeping ModernVideoPlayer.tsx as the main implementation if it contains the latest features.',
  },
}

/**
 * Action Items:
 *
 * 1. UI Components:
 *    - Keep PascalCase versions (Card.tsx, Dialog.tsx)
 *    - Remove lowercase versions
 *    - Update all imports to use PascalCase versions
 *
 * 2. Video Player:
 *    - Review ModernVideoPlayer.tsx vs other implementations
 *    - Consolidate features into a single implementation
 *    - Remove redundant files
 *    - Update all imports to use the consolidated version
 */
