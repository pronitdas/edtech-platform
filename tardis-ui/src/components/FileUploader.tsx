'use client';

import { insertKnowledge, uploadFiles } from "@/services/edtech-content";
import React, { useState } from "react";
import { useUser } from '@/contexts/UserContext';

const FileUploaderAPI: React.FC<{ onTextProcessed?: (text: string) => void }> = ({ onTextProcessed }) => {
    const [file, setFile] = useState<File | null>(null);
    const [knowledgeName, setKnowledgeName] = useState<string>("");
    const [response, setResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { user } = useUser()
    // Handle file selection
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
        }
    };

    // Handle knowledge name input
    const handleKnowledgeNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setKnowledgeName(event.target.value);
    };

    // Download object as JSON utility
    const downloadObjectAsJson = (exportObj: any, exportName: string) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
        const downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${exportName}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    // Validate form before submission
    const validateForm = (): boolean => {
        if (!file) {
            setError("Please select a file before submitting.");
            return false;
        }

        if (!knowledgeName.trim()) {
            setError("Please enter a knowledge name before submitting.");
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            setError(null);

            // Step 1: Insert knowledge into the database and retrieve knowledge_id
            const knowledge_id = await insertKnowledge(knowledgeName.trim(), user);
            console.log("Knowledge inserted with ID:", knowledge_id);

            // Step 2: Determine file type dynamically
            const fileType = file.type.startsWith("image/")
                ? "images"
                : file.type.startsWith("video/")
                    ? "video"
                    : "doc";

            // Step 3: Upload file to Supabase storage
            await uploadFiles([file], knowledge_id, fileType);

            setResponse("File uploaded and knowledge saved successfully!");
            if (onTextProcessed) onTextProcessed(`Knowledge ${knowledgeName} uploaded with ID: ${knowledge_id}`);

            alert("File uploaded successfully!");
        } catch (err) {
            setError("Failed to process the file. Please try again.");
            console.error("Error during file processing:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-100 rounded-lg p-6 shadow-md text-gray-800 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">Upload and Process Document</h1>

            {/* Knowledge Name Input */}
            <div className="mb-4">
                <label htmlFor="knowledgeName" className="block text-gray-700 font-bold mb-2">
                    Knowledge Name
                </label>
                <input
                    id="knowledgeName"
                    type="text"
                    value={knowledgeName}
                    onChange={handleKnowledgeNameChange}
                    placeholder="Enter knowledge name..."
                    className="block w-full text-gray-700 border rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* File Upload Input */}
            <div className="mb-4">
                <label htmlFor="fileUpload" className="block text-gray-700 font-bold mb-2">
                    Upload File
                </label>
                <input
                    id="fileUpload"
                    type="file"
                    onChange={handleFileChange}
                    className="block w-full text-gray-700 border rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full ${loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                disabled={loading}
            >
                {loading ? "Processing..." : "Upload and Convert"}
            </button>

            {/* Response Message */}
            {response && (
                <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded text-green-800">
                    <h2 className="font-bold">Response:</h2>
                    <pre className="text-sm whitespace-pre-wrap">{response}</pre>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded text-red-800">
                    <h2 className="font-bold">Error:</h2>
                    <p>{error}</p>
                </div>
            )}
        </div>
    );
};

export default FileUploaderAPI;
