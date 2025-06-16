import React from 'react';
import PERatioCalculator from '@/components/PERatioCalculator';
import PriceToCashFlowCalculator from '@/components/PriceToCashFlowCalculator';
import StockValuationModel from '@/components/StockValuationModel';
import DividendGrowthCalculator from '@/components/DividendGrowthModel';
import DiscountRateCalculator from '@/components/DiscountRateModel';
import PERatioVisualization from '@/components/PERatioVisualization';
import DividendGrowthModel from '@/components/DividendGrowthModel';
import BookValueCalculator from '@/components/BookValueCalculator';
import PriceToDividendCalculator from '@/components/PriceToDividendCalculator';
import LiquidationValueCalculator from '@/components/LiquidationValueCalculator';

// Map of special content start phrases to their corresponding components
const SPECIAL_CONTENT_MAP = {
    "How much investors": <PERatioCalculator />,
    "Evaluate": <PriceToCashFlowCalculator />,
    "This tool": <StockValuationModel />,
    "Understanding": <DividendGrowthCalculator />,
    "The discount rate": <DiscountRateCalculator />,
    "Key Insights": <PERatioVisualization />,
    "The Dividend Growth Model": <DividendGrowthModel />,
    "Book Value": <BookValueCalculator />,
    "Price-to-Dividend": <PriceToDividendCalculator />,
    "Liquidation value": <LiquidationValueCalculator />
};

/**
 * Checks if content starts with any special phrases and returns the corresponding component
 * @param content The content to check
 * @returns React component if a match is found, null otherwise
 */
export const getSpecialComponent = (content: string | any): React.ReactNode | null => {
    if (!content || typeof content !== 'string') return null;

    for (const [startPhrase, component] of Object.entries(SPECIAL_CONTENT_MAP)) {
        if (content.startsWith(startPhrase)) {
            return component;
        }
    }

    return null;
};
