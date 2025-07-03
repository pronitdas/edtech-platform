import React from 'react'
import PERatioCalculator from '@/components/PERatioCalculator'
import PriceToCashFlowCalculator from '@/components/PriceToCashFlowCalculator'
import StockValuationModel from '@/components/StockValuationModel'
import DividendGrowthCalculator from '@/components/DividendGrowthModel'
import DiscountRateCalculator from '@/components/DiscountRateModel'
import PERatioVisualization from '@/components/PERatioVisualization'
import DividendGrowthModel from '@/components/DividendGrowthModel'
import BookValueCalculator from '@/components/BookValueCalculator'
import PriceToDividendCalculator from '@/components/PriceToDividendCalculator'
import LiquidationValueCalculator from '@/components/LiquidationValueCalculator'

// Content mapping configuration type
interface ContentMappingConfig {
  readonly [key: string]: React.ReactNode
}

// Map of special content start phrases to their corresponding components
const SPECIAL_CONTENT_MAP: ContentMappingConfig = {
  'How much investors': <PERatioCalculator />,
  Evaluate: <PriceToCashFlowCalculator />,
  'This tool': <StockValuationModel />,
  Understanding: <DividendGrowthCalculator />,
  'The discount rate': <DiscountRateCalculator />,
  'Key Insights': <PERatioVisualization />,
  'The Dividend Growth Model': <DividendGrowthModel />,
  'Book Value': <BookValueCalculator />,
  'Price-to-Dividend': <PriceToDividendCalculator />,
  'Liquidation value': <LiquidationValueCalculator />,
} as const

/**
 * Checks if content starts with any special phrases and returns the corresponding component
 * @param content The content to check
 * @returns React component if a match is found, null otherwise
 */
export const getSpecialComponent = (
  content: string | unknown
): React.ReactNode | null => {
  if (!content || typeof content !== 'string') {
    return null
  }

  // Use Object.entries with proper typing
  const entries = Object.entries(SPECIAL_CONTENT_MAP) as Array<[string, React.ReactNode]>
  
  for (const [startPhrase, component] of entries) {
    if (content.startsWith(startPhrase)) {
      return component
    }
  }

  return null
}
