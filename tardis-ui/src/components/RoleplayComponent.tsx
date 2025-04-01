import React, { useState } from 'react';
import { MessageSquare, RefreshCw, Users, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface RoleplayScenario {
  title: string;
  context: string;
  roles: Array<{
    name: string;
    description: string;
  }>;
}

interface RoleplayComponentProps {
  scenarios: RoleplayScenario[];
  onRegenerate?: () => void;
  isGenerating?: boolean;
}

const RoleplayComponent: React.FC<RoleplayComponentProps> = ({
  scenarios,
  onRegenerate,
  isGenerating = false
}) => {
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [isViewingScenarios, setIsViewingScenarios] = useState(true);

  const activeScenario = scenarios[activeScenarioIndex];

  // Navigation functions
  const nextScenario = () => {
    if (activeScenarioIndex < scenarios.length - 1) {
      setActiveScenarioIndex(activeScenarioIndex + 1);
      setActiveRole(null);
    }
  };

  const prevScenario = () => {
    if (activeScenarioIndex > 0) {
      setActiveScenarioIndex(activeScenarioIndex - 1);
      setActiveRole(null);
    }
  };

  // View role details
  const selectRole = (roleName: string) => {
    setActiveRole(roleName);
    setIsViewingScenarios(false);
  };

  // Back to scenario selection
  const backToScenarios = () => {
    setIsViewingScenarios(true);
    setActiveRole(null);
  };

  // Get the selected role details
  const getSelectedRole = () => {
    return activeScenario.roles.find(role => role.name === activeRole);
  };

  // Render scenario selection view
  const renderScenarioView = () => {
    return (
      <div className="h-full flex flex-col">
        {/* Header with navigation */}
        <div className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Roleplay Scenarios</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={prevScenario}
              disabled={activeScenarioIndex === 0}
              className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous scenario"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-400">
              {activeScenarioIndex + 1} of {scenarios.length}
            </span>
            <button
              onClick={nextScenario}
              disabled={activeScenarioIndex === scenarios.length - 1}
              className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next scenario"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scenario content */}
        <div className="flex-grow overflow-auto p-4">
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2 text-indigo-400">{activeScenario.title}</h3>
            <p className="text-gray-300 mb-4">{activeScenario.context}</p>
            
            <div className="mt-6">
              <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>Available Roles</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeScenario.roles.map((role) => (
                  <button
                    key={role.name}
                    onClick={() => selectRole(role.name)}
                    className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-left transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-indigo-500 rounded-full p-2 mt-1">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-white">{role.name}</h5>
                        <p className="text-sm text-gray-300 mt-1 line-clamp-2">{role.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with regenerate button */}
        {onRegenerate && (
          <div className="bg-gray-800 p-4 border-t border-gray-700">
            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md transition-colors"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating New Scenarios...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Generate New Scenarios</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render selected role view
  const renderRoleView = () => {
    const selectedRole = getSelectedRole();
    
    if (!selectedRole) return null;

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 p-4 flex items-center gap-3 border-b border-gray-700">
          <button
            onClick={backToScenarios}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-700"
            aria-label="Back to scenarios"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-white">{selectedRole.name}</h2>
        </div>

        {/* Role content */}
        <div className="flex-grow overflow-auto p-4">
          <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
            <h3 className="text-lg font-semibold mb-2 text-indigo-400">Scenario: {activeScenario.title}</h3>
            <p className="text-gray-300">{activeScenario.context}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold mb-2 text-indigo-400">Your Role: {selectedRole.name}</h3>
            <p className="text-gray-300">{selectedRole.description}</p>
            
            <div className="mt-6 bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-white mb-2">Tips for Role-Playing:</h4>
              <ul className="text-gray-300 space-y-2 list-disc pl-5">
                <li>Consider how this character would approach the situation</li>
                <li>Think about their goals, motivations, and constraints</li>
                <li>Practice responding to questions as this character would</li>
                <li>Consider how your role interacts with others in the scenario</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation footer */}
        <div className="bg-gray-800 p-4 border-t border-gray-700 flex justify-between">
          <button
            onClick={backToScenarios}
            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Scenarios</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={prevScenario}
              disabled={activeScenarioIndex === 0}
              className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous scenario"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-400">
              {activeScenarioIndex + 1} of {scenarios.length}
            </span>
            <button
              onClick={nextScenario}
              disabled={activeScenarioIndex === scenarios.length - 1}
              className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next scenario"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 h-full rounded-lg overflow-hidden">
      {isViewingScenarios ? renderScenarioView() : renderRoleView()}
    </div>
  );
};

export default RoleplayComponent; 