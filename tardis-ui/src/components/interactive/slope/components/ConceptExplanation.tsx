'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export interface Concept {
  id: string;
  title: string;
  content: string;
  demoPoints?: { x: number; y: number }[];
  illustration?: string;
  formula?: string;
  examples?: {
    id: string;
    description: string;
    illustration?: string;
    formula?: string;
  }[];
}

export interface ConceptExplanationProps {
  concepts: Concept[];
  selectedConceptId: string | null;
  onSelectConcept: (id: string) => void;
  lineData?: {
    slope: number | null;
    yIntercept: number | null;
    equation: string;
    point1: { x: number; y: number };
    point2: { x: number; y: number };
    rise: number;
    run: number;
  } | null;
}

const ConceptExplanation: React.FC<ConceptExplanationProps> = ({
  concepts,
  selectedConceptId,
  onSelectConcept,
  lineData,
}) => {
  const selectedConcept = concepts.find(concept => concept.id === selectedConceptId);

  return (
    <div className="bg-gray-800 p-4 rounded-md h-full flex flex-col">
      {/* Concept Selector - Fixed at top */}
      <div className="mb-4 flex-shrink-0">
        <label htmlFor="concept-select" className="block text-sm font-medium text-gray-300 mb-2">
          Choose a slope concept:
        </label>
        <select
          id="concept-select"
          className="w-full bg-gray-900 text-white p-2 rounded-md border border-gray-700"
          value={selectedConceptId || ''}
          onChange={(e) => onSelectConcept(e.target.value)}
        >
          <option value="">--Select a concept--</option>
          {concepts.map(concept => (
            <option key={concept.id} value={concept.id}>
              {concept.title}
            </option>
          ))}
        </select>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pr-1">
        {selectedConcept ? (
          <div className="concept-content">
            <h3 className="text-lg font-medium text-white mb-2">
              {selectedConcept.title}
            </h3>
            
            {/* Main Content */}
            <div className="prose prose-invert mb-4">
              <ReactMarkdown
                className="text-gray-300"
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {selectedConcept.content}
              </ReactMarkdown>
            </div>
            
            {/* Formula Display */}
            {selectedConcept.formula && (
              <div className="my-4 p-3 bg-gray-900 rounded-md text-center">
                <ReactMarkdown
                  className="text-gray-100 text-lg"
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {selectedConcept.formula}
                </ReactMarkdown>
              </div>
            )}
            
            {/* Illustration */}
            {selectedConcept.illustration && (
              <div className="my-4 flex justify-center">
                <img 
                  src={selectedConcept.illustration} 
                  alt={selectedConcept.title} 
                  className="max-w-full h-auto rounded-md border border-gray-700"
                />
              </div>
            )}
            
            {/* Examples */}
            {selectedConcept.examples?.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-medium text-white mb-2">Examples</h4>
                <div className="space-y-3">
                  {selectedConcept.examples.map(example => (
                    <div key={example.id} className="p-3 bg-gray-900 rounded-md">
                      <ReactMarkdown
                        className="text-gray-300"
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {example.description}
                      </ReactMarkdown>
                      
                      {/* Example Formula */}
                      {example.formula && (
                        <div className="mt-2 text-center">
                          <ReactMarkdown
                            className="text-gray-100"
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {example.formula}
                          </ReactMarkdown>
                        </div>
                      )}
                      
                      {example.illustration && (
                        <div className="mt-2 flex justify-center">
                          <img 
                            src={example.illustration} 
                            alt="Example illustration" 
                            className="max-w-full h-auto rounded-md"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Line Information Display */}
            {lineData && (
              <div className="mt-4 p-3 bg-gray-900 rounded-md">
                <h4 className="text-md font-medium text-white mb-2">Current Line Analysis</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">
                    <span className="text-green-400">Point 1:</span> ({lineData.point1.x.toFixed(2)}, {lineData.point1.y.toFixed(2)})
                  </p>
                  <p className="text-gray-300">
                    <span className="text-green-400">Point 2:</span> ({lineData.point2.x.toFixed(2)}, {lineData.point2.y.toFixed(2)})
                  </p>
                  <p className="text-gray-300">
                    <span className="text-green-400">Rise:</span> {lineData.rise.toFixed(2)}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-green-400">Run:</span> {lineData.run.toFixed(2)}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-green-400">Slope:</span> {lineData.slope !== null ? lineData.slope.toFixed(2) : 'Undefined'}
                  </p>
                  
                  {/* Enhanced equation display using KaTeX */}
                  <div className="text-gray-300">
                    <span className="text-green-400">Equation:</span>
                    <div className="inline-block ml-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {`$${lineData.equation.replace('y = ', '')}$`}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-8 text-gray-400">
            Select a concept from the dropdown to learn about slope.
          </div>
        )}
      </div>
    </div>
  );
};

export default ConceptExplanation; 