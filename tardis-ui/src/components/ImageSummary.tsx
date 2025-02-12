'use client'

import React, { useState } from "react";
import { MarkdownViewer } from "./MarkDownViewer";

interface ImageCarouselProps {
    slides: string[]; // Array of summary slide content
    imageUrls: string[]; // Array of image URLs corresponding to each slide
    isVertical?: boolean; // Option to choose vertical or horizontal layout
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ slides, imageUrls, isVertical = false }) => {
    const [currentPage, setCurrentPage] = useState<number>(0);

    // Navigation handlers
    const goToNextPage = () => {
        if (currentPage < slides.length - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Carousel container styling
    const carouselContainerStyles = {
        transform: isVertical
            ? `translateY(-${currentPage * 100}%)`
            : `translateX(-${currentPage * 100}%)`,
        transition: "transform 0.5s ease-in-out",
    };

    return (
        <div className="overflow-hidden rounded-lg shadow-lg max-w-3xl">
            <div
                className={`flex ${isVertical ? "flex-col" : "flex-row"} w-full`}
                style={carouselContainerStyles}
            >
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className="flex-shrink-0 w-full h-full p-4 space-y-4 flex flex-col items-center"
                        style={{
                            width: isVertical ? "100%" : "100%",
                            height: isVertical ? "100%" : "100%",
                        }}
                    >
                        {imageUrls[index] && (
                            <img
                                src={imageUrls[index]}
                                alt={`Visual for slide ${index + 1}`}
                                className="w-64 h-64 rounded-lg shadow-lg object-cover"
                            />
                        )}
                        <MarkdownViewer key={index}content={slide} />
                    </div>
                ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between mt-4">
                <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 0}
                    className="bg-blue-500 text-white py-2 px-4 rounded disabled:bg-blue-200"
                >
                    Previous
                </button>
                <button
                    onClick={goToNextPage}
                    disabled={currentPage === slides.length - 1}
                    className="bg-blue-500 text-white py-2 px-4 rounded disabled:bg-blue-200"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default ImageCarousel;
