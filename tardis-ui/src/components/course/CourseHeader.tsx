'use client';

import React from 'react';
import { ChevronLeft, Settings, FileText, BookOpen, PieChart, Brain, Video, BarChart2 } from 'lucide-react';
import { ContentType } from '@/services/edtech-api';
import { ChapterV1 } from '@/types/database';

// --- Icon Mapping Logic (moved here or imported) ---
type IconMap = { [key: string]: React.ComponentType<{ className?: string }> };

const iconMap: IconMap = {
    FileText,
    BookOpen,
    PieChart,
    Brain,
    Video,
    BarChart2,
};

const getIconComponent = (identifier: string): React.ReactElement | null => {
    const IconComponent = iconMap[identifier];
    return IconComponent ? <IconComponent className="w-4 h-4 mr-1" /> : null; // Added margin
};
// --- End Icon Mapping Logic ---

// Updated TabConfig - expects identifier, no condition
interface TabConfig {
  label: string;
  key: string;
  iconIdentifier: string; // Expect identifier now
}

interface CourseHeaderProps {
  chapter: ChapterV1;
  activeTab: string;
  sidebarOpen: boolean;
  // showSettings: boolean; // No longer needed directly if logic is self-contained
  availableTabs: TabConfig[]; // Expects updated TabConfig
  getMissingContentTypes: (content: any) => ContentType[]; // Keep this prop
  toggleSidebar: () => void;
  handleTabClick: (tabKey: string) => void;
  // toggleSettings: () => void; // Renamed to onShowSettings for clarity
  onShowSettings: () => void;
  showSettingsButton: boolean; // Prop to control button visibility
  onShowReport: () => void; // Add prop for showing the report
}

const CourseHeader: React.FC<CourseHeaderProps> = ({
  chapter,
  activeTab,
  sidebarOpen,
  availableTabs,
  getMissingContentTypes,
  toggleSidebar,
  handleTabClick,
  onShowSettings, // Use the new prop name
  showSettingsButton, // Use the visibility prop
  onShowReport, // Destructure the new prop
}) => {
  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChevronLeft 
            className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white transition-colors" 
            onClick={() => window.history.back()}
            aria-label="Go back"
          />
          <h1 className="text-xl font-semibold text-white truncate" title={chapter.chaptertitle || "Course Content"}>
            {chapter.chaptertitle || "Course Content"}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {activeTab === "video" && (
            <button
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white focus:outline-none"
              aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              {sidebarOpen ? "Hide Chapters" : "Show Chapters"}
            </button>
          )}
          
          {/* Settings button controlled by prop */}
          {showSettingsButton && (
            <button
              onClick={onShowSettings} // Use the passed handler
              className="text-gray-400 hover:text-white focus:outline-none"
              aria-label="Content settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
          
          {/* Report Button */}
          <button
            onClick={onShowReport} // Use the passed handler
            className="text-gray-400 hover:text-white focus:outline-none"
            aria-label="Show learning report"
          >
            <BarChart2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 mt-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {availableTabs.map(tab => {
          const iconElement = getIconComponent(tab.iconIdentifier);
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
              aria-current={activeTab === tab.key ? 'page' : undefined}
            >
              {iconElement} {/* Render the icon element */} 
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CourseHeader; 