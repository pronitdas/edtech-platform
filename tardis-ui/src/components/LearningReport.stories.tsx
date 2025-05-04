import type { Meta, StoryObj } from '@storybook/react';
import LearningReport from './LearningReport';
import { analyticsService } from '@/services/analytics-service';
import { MockInteractionTrackerProvider } from '../stories/MockInteractionTrackerProvider';

// Create a mock implementation of the analytics service
const originalGetUserCompletion = analyticsService.getUserCompletion;

// Mock data for our stories
const mockAnalyticsData = {
  engagement_score: 75,
  understanding: 'Proficient',
  strengths: ['Concept visualization', 'Problem-solving approach'],
  weaknesses: ['Mathematical notation', 'Advanced theorems'],
  recommendations: [
    'Review the properties of matrices',
    'Practice more eigenvalue problems',
    'Study the relationship between linear transformations and matrices'
  ]
};

const meta: Meta<typeof LearningReport> = {
  title: 'Course/LearningReport',
  component: LearningReport,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
    },
  },
  argTypes: {
    userId: { control: 'text' },
    knowledgeId: { control: 'text' },
    onClose: { action: 'report closed' },
  },
  // Mock the analytics service before each story
  decorators: [
    (Story) => {
      // Override the getUserCompletion method for Storybook
      analyticsService.getUserCompletion = async () => mockAnalyticsData;
      
      return (
        <div className="bg-gray-900 min-h-screen">
          <MockInteractionTrackerProvider>
            <Story />
          </MockInteractionTrackerProvider>
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof LearningReport>;

export const Default: Story = {
  args: {
    userId: 'user123',
    knowledgeId: '456',
  },
};

export const WithDifferentKnowledgeId: Story = {
  args: {
    userId: 'user123',
    knowledgeId: '789',
  },
};

export const WithDifferentUser: Story = {
  args: {
    userId: 'user456',
    knowledgeId: '456',
  },
};

// This story will show loading state 
export const Loading: Story = {
  decorators: [
    (Story) => {
      // Override with a function that never resolves to simulate loading
      analyticsService.getUserCompletion = () => new Promise(() => {});
      
      return (
        <div className="bg-gray-900 min-h-screen">
          <MockInteractionTrackerProvider>
            <Story />
          </MockInteractionTrackerProvider>
        </div>
      );
    },
  ],
  args: {
    userId: 'user123',
    knowledgeId: '456',
  },
};

// This story will show an error state
export const Error: Story = {
  decorators: [
    (Story) => {
      // Override with a function that rejects to simulate error
      analyticsService.getUserCompletion = () => Promise.reject('Error fetching analytics');
      
      return (
        <div className="bg-gray-900 min-h-screen">
          <MockInteractionTrackerProvider>
            <Story />
          </MockInteractionTrackerProvider>
        </div>
      );
    },
  ],
  args: {
    userId: 'user123',
    knowledgeId: '456',
  },
};

// Note: In a real implementation, you would want to restore the original
// implementation after the stories run. In Storybook, this isn't typically
// needed as the stories run in isolation. 