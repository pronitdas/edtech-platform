'use client';

import React, { useState } from "react";
import MarkdownViewer from "./MarkDownViewer";

// Markdown Slideshow Component
const MarkdownSlideshow: React.FC<{
    content: string[];
    images?: string[];
    knowledge_id: string;
}> = ({ content, images = [], knowledge_id }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    console.log(content);
    const hasNextSlide = currentSlide < content.length - 1;
    const hasPreviousSlide = currentSlide > 0;

    const nextSlide = () => {
        if (hasNextSlide) setCurrentSlide((prev) => prev + 1);
    };

    const previousSlide = () => {
        if (hasPreviousSlide) setCurrentSlide((prev) => prev - 1);
    };

    return (
        <div className="markdown-slideshow border-double p-2 flex flex-col w-full">
            {/* Slide Content */}
            <div className="w-full max-h-[calc(100vh-10rem)] overflow-auto bg-gray-800 rounded-lg shadow p-3">
                <MarkdownViewer
                    key={currentSlide}
                    content={content[currentSlide]}
                    images={images}
                    knowledge_id={knowledge_id}
                />
            </div>

            {/* Navigation Buttons */}
            <div className="navigation-buttons mt-4 flex justify-between items-center">
                <button
                    onClick={previousSlide}
                    disabled={!hasPreviousSlide}
                    className="bg-blue-500 text-white py-2 px-4 rounded-lg disabled:bg-gray-400"
                >
                    Previous
                </button>
                <span className="text-sm text-gray-500">{`Slide ${currentSlide + 1} of ${content.length}`}</span>
                <button
                    onClick={nextSlide}
                    disabled={!hasNextSlide}
                    className="bg-blue-500 text-white py-2 px-4 rounded-lg disabled:bg-gray-400"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default MarkdownSlideshow;
