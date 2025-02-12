'use client';

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import DOMPurify from "dompurify";

// Utility function to generate image URLs
const getImageSrc = (src: string, knowledge_id: string) => {
    return `https://onyibiwnfwxatadlkygz.supabase.co/storage/v1/object/public/media/image/${knowledge_id}/${src}`;
};

// Markdown Viewer Component
const MarkdownViewer: React.FC<{ content: string; images?: string[]; knowledge_id: string }> = (
    ({ content, knowledge_id }) => {
        const slide = content.replace("```markdown", "");
        // Sanitize content
        const sanitizedContent = React.useMemo(() => {
            try {
                return DOMPurify.sanitize(slide || "");
            } catch (err) {
                console.error("Content sanitization failed:", err);
                return "Error: Unable to render content.";
            }
        }, [slide]);

        // Validate input
        if (typeof slide !== "string") {
            console.warn("Invalid content passed to MarkdownViewer:", slide);
            return <div>Error: Invalid content format. Expected a string.</div>;
        }

        return (
            <div className="h-full overflow-y-scroll">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                        h1: (props) => (
                            <h1 className="text-3xl font-extrabold text-green-400 mt-8 mb-4" {...props} />
                        ),
                        h2: (props) => (
                            <h2 className="text-2xl font-bold text-green-300 mt-6 mb-3 border-b border-green-700" {...props} />
                        ),
                        h3: (props) => (
                            <h3 className="text-xl font-semibold text-green-200 mt-4 mb-2" {...props} />
                        ),
                        p: (props) => (
                            <p className="my-4 text-gray-300 whitespace-normal leading-relaxed" {...props} />
                        ),
                        ul: (props) => (
                            <ul className="list-disc ml-6 my-4 space-y-2 text-gray-300" {...props} />
                        ),
                        ol: (props) => (
                            <ol className="list-decimal ml-6 my-4 space-y-2 text-gray-300" {...props} />
                        ),
                        li: (props) => <li className="ml-2" {...props} />,
                        table: (props) => (
                            <div className="overflow-x-auto my-6">
                                <table
                                    className="min-w-full border border-green-600 divide-y divide-green-600 text-gray-200"
                                    {...props}
                                />
                            </div>
                        ),
                        th: (props) => (
                            <th className="px-4 py-2 text-left font-semibold text-green-300 border-b border-green-600" {...props} />
                        ),
                        td: (props) => (
                            <td className="px-4 py-2 border-b border-green-600" {...props} />
                        ),
                        blockquote: (props) => (
                            <blockquote className="pl-4 italic border-l-4 border-green-500 text-green-300" {...props} />
                        ),
                        code: (props) => (
                            <code className="px-2 py-1 bg-gray-700 whitespace-normal rounded text-sm font-mono text-green-400" {...props} />
                        ),
                        img: ({ src, alt }) => {
                            const resolvedSrc = src ? getImageSrc(src, knowledge_id) : "";
                            return (
                                <img
                                    src={resolvedSrc}
                                    alt={alt || ""}
                                    style={{
                                        maxWidth: "100%",
                                        border: "1px solid #ddd",
                                        margin: "10px 0",
                                    }}
                                />
                            );
                        },
                        hr: (props) => (
                            <hr className="my-8 border-t border-green-700" {...props} />
                        ),
                    }}
                >
                    {sanitizedContent}
                </ReactMarkdown>
            </div>
        );
    }

);

export default MarkdownViewer;
