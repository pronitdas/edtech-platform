import React, { useState } from 'react';
import supabase from '@/services/supabase';
import { InteractiveComponentTypes } from '@/components/interactive';

const AddInteractiveContent = () => {
  const [chapterId, setChapterId] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleAddInteractiveContent = async () => {
    if (!chapterId || isNaN(parseInt(chapterId))) {
      setMessage('Please enter a valid chapter ID');
      return;
    }

    setStatus('loading');
    setMessage('Adding interactive content...');

    try {
      // Create sample interactive content with slope drawer problems
      const interactiveContent = {
        type: InteractiveComponentTypes.SLOPE_DRAWER,
        problems: [
          {
            id: "p1",
            question: "Draw a line with slope 2 and y-intercept 3",
            difficulty: "easy",
            hints: ["Remember slope is rise over run", "Try plotting (0,3) first"],
            solution: "y = 2x + 3",
            data: { slope: 2, yIntercept: 3 }
          },
          {
            id: "p2",
            question: "Draw a line with slope -1 and y-intercept 5",
            difficulty: "medium",
            hints: ["Negative slope means the line goes down as x increases", "Try plotting (0,5) first"],
            solution: "y = -1x + 5",
            data: { slope: -1, yIntercept: 5 }
          },
          {
            id: "p3",
            question: "Draw a vertical line at x = 4",
            difficulty: "hard",
            hints: ["Vertical lines have undefined slope", "All points on the line have the same x-value"],
            solution: "Vertical line: x = 4"
          }
        ],
        conceptExplanations: [
          {
            id: "c1",
            title: "Understanding Slope",
            content: "Slope measures the steepness of a line. It is calculated as the ratio of vertical change (rise) to horizontal change (run).",
            examples: [
              {
                id: "e1",
                description: "A line with slope 2 rises 2 units for every 1 unit it runs horizontally."
              }
            ]
          }
        ]
      };

      // Update the chapter content with interactive content
      const { data, error } = await supabase
        .from('ed_tech_content')
        .update({ interactive: interactiveContent })
        .eq('chapter_id', parseInt(chapterId))
        .select();

      if (error) {
        throw error;
      }

      setStatus('success');
      setMessage(`Interactive content added to chapter ${chapterId}. ${data?.length} rows updated.`);
    } catch (error) {
      console.error('Error adding interactive content:', error);
      setStatus('error');
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add Interactive Content</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Chapter ID:</label>
        <input
          type="number"
          value={chapterId}
          onChange={(e) => setChapterId(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Enter chapter ID"
        />
      </div>
      
      <button
        onClick={handleAddInteractiveContent}
        disabled={status === 'loading'}
        className={`w-full py-2 px-4 rounded font-medium ${
          status === 'loading' 
            ? 'bg-gray-400' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {status === 'loading' ? 'Adding...' : 'Add Slope Drawing Tool'}
      </button>
      
      {message && (
        <div className={`mt-4 p-3 rounded ${
          status === 'error' 
            ? 'bg-red-100 text-red-700' 
            : status === 'success' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-blue-100 text-blue-700'
        }`}>
          {message}
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Enter the chapter ID where you want to add the interactive content</li>
          <li>Click the "Add Slope Drawing Tool" button</li>
          <li>Once successful, navigate to the chapter in the course</li>
          <li>You should now see a "Practice" tab with the slope drawing tool</li>
        </ol>
      </div>
    </div>
  );
};

export default AddInteractiveContent; 