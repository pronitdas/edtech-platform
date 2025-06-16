import { useState, useEffect, lazy, Suspense } from 'react'
// import { interactionTracker } from '@/services/interaction-tracking';
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext'
import { BookOpen, Code, PenTool, Play } from 'lucide-react'

// Import module components dynamically
const PriceToEarningsModel = lazy(() => import('./PERatioCalculator'))
const PriceToCashFlowModel = lazy(() => import('./PriceToCashFlowCalculator'))
const PriceToDividendModel = lazy(() => import('./PriceToDividendCalculator'))
const BookValueCalculator = lazy(() => import('./BookValueCalculator'))
const StockValuationModel = lazy(() => import('./StockValuationModel'))
const DividendGrowthCalculator = lazy(
  () => import('./DividendGrowthCalculator')
)
const DiscountRateModel = lazy(() => import('./DiscountRateModel'))

interface Module {
  title: string
  component: string
  type: 'animation' | 'practice' | 'interactive'
  relatedVideos?: string[]
  description?: string
  icon?: React.ReactNode
}

interface InteractiveModuleProps {
  modules: Module[]
  onModuleComplete?: (moduleTitle: string) => void
  onClose?: () => void
}

const InteractiveModule = ({
  modules,
  onModuleComplete,
  onClose,
}: InteractiveModuleProps) => {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [showModuleList, setShowModuleList] = useState(true)
  const { trackEvent } = useInteractionTracker() as any // Cast to access internal trackEvent

  // Handle module selection
  const handleModuleSelect = (module: Module) => {
    setSelectedModule(module)
    setShowModuleList(false)
    // interactionTracker.trackAnimationView();
    if (trackEvent) {
      trackEvent('module_start', undefined, {
        moduleTitle: module.title,
        moduleType: module.type,
        moduleComponent: module.component,
      })
    }
  }

  // Handle module completion
  const handleModuleComplete = () => {
    if (selectedModule) {
      if (onModuleComplete) {
        onModuleComplete(selectedModule.title)
      }
      if (trackEvent) {
        trackEvent('module_complete', undefined, {
          moduleTitle: selectedModule.title,
          moduleType: selectedModule.type,
          moduleComponent: selectedModule.component,
        })
      }
    }
    setShowModuleList(true)
    setSelectedModule(null)
  }

  // Handle back button click
  const handleBack = () => {
    setShowModuleList(true)
    setSelectedModule(null)
  }

  // Render the appropriate component based on the selected module
  const renderModuleComponent = () => {
    if (!selectedModule) return null

    const componentMap = {
      PriceToEarningsModel: <PriceToEarningsModel />,
      PriceToCashFlowModel: <PriceToCashFlowModel />,
      PriceToDividendModel: <PriceToDividendModel />,
      BookValueCalculator: <BookValueCalculator />,
      StockValuationModel: <StockValuationModel />,
      DividendGrowthCalculator: <DividendGrowthCalculator />,
      DiscountRateModel: <DiscountRateModel />,
    }

    return (
      <Suspense
        fallback={
          <div className='flex h-full items-center justify-center'>
            <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600'></div>
          </div>
        }
      >
        {componentMap[selectedModule.component] || (
          <div className='flex h-full flex-col items-center justify-center text-white'>
            <p className='mb-4 text-xl'>
              Component not found: {selectedModule.component}
            </p>
            <button
              onClick={handleBack}
              className='rounded bg-indigo-600 px-4 py-2 font-semibold text-white shadow transition duration-200 ease-in-out hover:bg-indigo-700'
            >
              Back to Modules
            </button>
          </div>
        )}
      </Suspense>
    )
  }

  // Get icon for module type
  const getModuleIcon = (type: string, customIcon?: React.ReactNode) => {
    if (customIcon) return customIcon

    switch (type) {
      case 'animation':
        return <Play className='h-5 w-5' />
      case 'practice':
        return <PenTool className='h-5 w-5' />
      case 'interactive':
        return <Code className='h-5 w-5' />
      default:
        return <BookOpen className='h-5 w-5' />
    }
  }

  return (
    <div className='h-full w-full overflow-hidden rounded-lg bg-gray-900 text-white'>
      {showModuleList ? (
        <div className='p-6'>
          <div className='mb-6 flex items-center justify-between'>
            <h3 className='text-xl font-semibold text-white'>
              Interactive Modules
            </h3>
            {onClose && (
              <button
                onClick={onClose}
                className='flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white shadow transition duration-200 ease-in-out hover:bg-indigo-700'
              >
                Close
              </button>
            )}
          </div>

          <div className='grid grid-cols-1 gap-4'>
            {modules.map((module, index) => (
              <button
                key={index}
                onClick={() => handleModuleSelect(module)}
                className='flex transform items-center gap-3 rounded-md bg-gray-800 p-4 font-medium text-white shadow transition-all duration-200 ease-in-out hover:translate-x-1 hover:bg-indigo-600'
              >
                <div className='rounded-md bg-indigo-700 p-2'>
                  {getModuleIcon(module.type, module.icon)}
                </div>
                <div className='flex-1 text-left'>
                  <span className='block text-base'>{module.title}</span>
                  {module.description && (
                    <span className='mt-1 block text-xs text-gray-300'>
                      {module.description}
                    </span>
                  )}
                </div>
                <span className='rounded-full bg-indigo-800 px-2 py-1 text-xs'>
                  {module.type}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className='relative h-full w-full'>
          {/* Module Content */}
          <div className='h-full w-full'>{renderModuleComponent()}</div>

          {/* Control Buttons */}
          <div className='absolute right-4 top-4 flex gap-2'>
            <button
              onClick={handleBack}
              className='rounded-md bg-gray-700 px-4 py-2 font-semibold text-white shadow transition duration-200 ease-in-out hover:bg-gray-600'
            >
              Back
            </button>
            <button
              onClick={handleModuleComplete}
              className='rounded-md bg-green-600 px-4 py-2 font-semibold text-white shadow transition duration-200 ease-in-out hover:bg-green-700'
            >
              Complete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default InteractiveModule
