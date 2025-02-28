'use client';

import { insertKnowledge, uploadFiles } from "@/services/edtech-content";
import React, { useState } from "react";
import { useUser } from '@/contexts/UserContext';

interface FileUploaderProps {
    onTextProcessed?: (text: string) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onTextProcessed }) => {
    const [file, setFile] = useState<File | null>(null);
    const [knowledgeName, setKnowledgeName] = useState<string>("");
    const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: "", type: null });
    const [loading, setLoading] = useState(false);
    const { user } = useUser();

    const handleSubmit = async () => {
        // Validate inputs
        if (!file) {
            setStatus({ message: "Please select a file before submitting.", type: 'error' });
            return;
        }

        if (!knowledgeName.trim()) {
            setStatus({ message: "Please enter a knowledge name before submitting.", type: 'error' });
            return;
        }

        try {
            setLoading(true);
            setStatus({ message: "", type: null });

            // Insert knowledge and get ID
            const knowledge_id = await insertKnowledge(knowledgeName.trim(), user);

            // Determine file type
            const fileType = file.type.startsWith("image/")
                ? "images"
                : file.type.startsWith("video/")
                    ? "video"
                    : "doc";

            // Upload file
            await uploadFiles([file], knowledge_id, fileType);

            setStatus({ message: "File uploaded successfully!", type: 'success' });
            if (onTextProcessed) {
                onTextProcessed(`Knowledge ${knowledgeName} uploaded with ID: ${knowledge_id}`);
            }
        } catch (err) {
            setStatus({ message: "Failed to process the file. Please try again.", type: 'error' });
            console.error("Error during file processing:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-100 rounded-lg p-4 text-gray-800">
            <h1 className="text-xl font-bold mb-3">Upload Document</h1>

            <div className="mb-3">
                <label htmlFor="knowledgeName" className="block font-medium mb-1">Knowledge Name</label>
                <input
                    id="knowledgeName"
                    type="text"
                    value={knowledgeName}
                    onChange={(e) => setKnowledgeName(e.target.value)}
                    placeholder="Enter knowledge name..."
                    className="w-full border rounded p-2"
                />
            </div>

            <div className="mb-3">
                <label htmlFor="fileUpload" className="block font-medium mb-1">Upload File</label>
                <input
                    id="fileUpload"
                    type="file"
                    onChange={(e) => e.target.files && setFile(e.target.files[0])}
                    className="w-full border rounded p-2"
                />
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading}
                className={`bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded w-full ${loading ? "opacity-50" : ""}`}
            >
                {loading ? "Processing..." : "Upload"}
            </button>

            {status.message && (
                <div className={`mt-3 p-3 rounded ${status.type === 'success' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {status.message}
                </div>
            )}
        </div>
    );
};

export default FileUploader;
