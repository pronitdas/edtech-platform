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
  onShowSettings,
  showSettingsButton,
  onShowReport,
}) => {
  console.log('CourseHeader rendered with:', {
    activeTab,
    availableTabs,
    showSettingsButton
  });

  return (
    <div className="bg-gray-800 border-b border-gray-700">
      {/* Top Bar */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChevronLeft 
              className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white transition-colors" 
              onClick={() => window.history.back()}
              aria-label="Go back"
            />
            <h1 className="text-xl font-semibold text-white truncate" title={chapter.chaptertitle}>
              {chapter.chaptertitle}
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
            
            {showSettingsButton && (
              <button
                onClick={onShowSettings}
                className="text-gray-400 hover:text-white focus:outline-none"
                aria-label="Content settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            
            <button
              onClick={onShowReport}
              className="text-gray-400 hover:text-white focus:outline-none"
              aria-label="Show learning report"
            >
              <BarChart2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 flex items-center gap-1 overflow-x-auto">
        {availableTabs.map((tab) => {
          console.log('Rendering tab:', tab);
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`
                px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap
                ${isActive 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}
              `}
            >
              <div className="flex items-center gap-2">
                {/* Render the icon using the iconIdentifier */}
                {getIconComponent(tab.iconIdentifier)}
                {tab.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CourseHeader; 