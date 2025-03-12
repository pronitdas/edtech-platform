import { useState, useEffect, lazy, Suspense } from 'react';
import { interactionTracker } from '@/services/interaction-tracking';
import { BookOpen, Code, PenTool, Play } from 'lucide-react';

// Import module components dynamically
const PriceToEarningsModel = lazy(() => import('./PERatioCalculator'));
const PriceToCashFlowModel = lazy(() => import('./PriceToCashFlowCalculator'));
const PriceToDividendModel = lazy(() => import('./PriceToDividendCalculator'));
const BookValueCalculator = lazy(() => import('./BookValueCalculator'));
const StockValuationModel = lazy(() => import('./StockValuationModel'));
const DividendGrowthCalculator = lazy(() => import('./DividendGrowthCalculator'));
const DiscountRateModel = lazy(() => import('./DiscountRateModel'));

interface Module {
  title: string;
  component: string;
  type: 'animation' | 'practice' | 'interactive';
  relatedVideos?: string[];
  description?: string;
  icon?: React.ReactNode;
}

interface InteractiveModuleProps {
  modules: Module[];
  onModuleComplete?: (moduleTitle: string) => void;
  onClose?: () => void;
}

const InteractiveModule = ({ 
  modules, 
  onModuleComplete,
  onClose
}: InteractiveModuleProps) => {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [showModuleList, setShowModuleList] = useState(true);

  // Handle module selection
  const handleModuleSelect = (module: Module) => {
    setSelectedModule(module);
    setShowModuleList(false);
    interactionTracker.trackAnimationView();
  };

  // Handle module completion
  const handleModuleComplete = () => {
    if (selectedModule && onModuleComplete) {
      onModuleComplete(selectedModule.title);
    }
    setShowModuleList(true);
    setSelectedModule(null);
  };

  // Handle back button click
  const handleBack = () => {
    setShowModuleList(true);
    setSelectedModule(null);
  };

  // Render the appropriate component based on the selected module
  const renderModuleComponent = () => {
    if (!selectedModule) return null;

    const componentMap = {
      'PriceToEarningsModel': <PriceToEarningsModel />,
      'PriceToCashFlowModel': <PriceToCashFlowModel />,
      'PriceToDividendModel': <PriceToDividendModel />,
      'BookValueCalculator': <BookValueCalculator />,
      'StockValuationModel': <StockValuationModel />,
      'DividendGrowthCalculator': <DividendGrowthCalculator />,
      'DiscountRateModel': <DiscountRateModel />
    };

    return (
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      }>
        {componentMap[selectedModule.component] || (
          <div className="flex flex-col items-center justify-center h-full text-white">
            <p className="text-xl mb-4">Component not found: {selectedModule.component}</p>
            <button
              onClick={handleBack}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded shadow transition duration-200 ease-in-out"
            >
              Back to Modules
            </button>
          </div>
        )}
      </Suspense>
    );
  };

  // Get icon for module type
  const getModuleIcon = (type: string, customIcon?: React.ReactNode) => {
    if (customIcon) return customIcon;
    
    switch (type) {
      case 'animation':
        return <Play className="w-5 h-5" />;
      case 'practice':
        return <PenTool className="w-5 h-5" />;
      case 'interactive':
        return <Code className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-full h-full bg-gray-900 text-white rounded-lg overflow-hidden">
      {showModuleList ? (
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white">Interactive Modules</h3>
            {onClose && (
              <button 
                onClick={onClose}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md shadow transition duration-200 ease-in-out flex items-center gap-2"
              >
                Close
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {modules.map((module, index) => (
              <button
                key={index}
                onClick={() => handleModuleSelect(module)}
                className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-indigo-600 text-white font-medium rounded-md shadow transition-all duration-200 ease-in-out transform hover:translate-x-1"
              >
                <div className="bg-indigo-700 p-2 rounded-md">
                  {getModuleIcon(module.type, module.icon)}
                </div>
                <div className="flex-1 text-left">
                  <span className="block text-base">{module.title}</span>
                  {module.description && (
                    <span className="text-xs text-gray-300 block mt-1">{module.description}</span>
                  )}
                </div>
                <span className="text-xs bg-indigo-800 px-2 py-1 rounded-full">
                  {module.type}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full h-full relative">
          {/* Module Content */}
          <div className="w-full h-full">
            {renderModuleComponent()}
          </div>
          
          {/* Control Buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={handleBack}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md shadow transition duration-200 ease-in-out"
            >
              Back
            </button>
            <button
              onClick={handleModuleComplete}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md shadow transition duration-200 ease-in-out"
            >
              Complete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveModule; 