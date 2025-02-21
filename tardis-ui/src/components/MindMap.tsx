import React, { useEffect, useState, useCallback } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    MarkerType,
    ReactFlowProvider,
    useReactFlow,
} from '@xyflow/react';
import Dagre from '@dagrejs/dagre';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import useAuthState from '@/hooks/useAuth';
import { OpenAIClient } from '@/services/openAi';

import '@xyflow/react/dist/style.css';

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: direction, ranksep: 80, nodesep: 40 });

    edges.forEach((edge) => g.setEdge(edge.source, edge.target));
    nodes.forEach((node) => {
        // Set default dimensions if not measured
        const width = 180;  // default width
        const height = 60;  // default height
        g.setNode(node.id, { width, height });
    });

    Dagre.layout(g);

    const layoutedNodes = nodes.map((node) => {
        const position = g.node(node.id);
        return {
            ...node,
            position: {
                x: position.x - 10,  // center the node by subtracting half the width
                y: position.y - 10,  // center the node by subtracting half the height
            },
        };
    });

    return {
        nodes: layoutedNodes,
        edges,
    };
};

const MindMapInner = ({ markdown }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { oAiKey } = useAuthState();
    const [apiClient, setApiClient] = useState(null);
    const { fitView } = useReactFlow();

    const onConnect = useCallback(
        (connection) => {
            setEdges((oldEdges) => addEdge(connection, oldEdges));
        },
        [setEdges],
    );

    useEffect(() => {
        if (!apiClient && oAiKey) {
            setApiClient(new OpenAIClient(oAiKey));
        }
    }, [oAiKey, apiClient]);

    const cleanAndParseJSON = (text) => {
        let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        try {
            return JSON.parse(cleaned);
        } catch (e) {
            console.error("Failed to parse JSON:", e);
            return null;
        }
    };

    const generateMindMapStructure = useCallback(async (markdown) => {
        if (!apiClient) return null;

        try {
            const prompt = `Generate a mind map structure from this markdown content as a JSON object containing both nodes and edges arrays. The JSON should have this exact structure:
{
  "nodes": [
    {
      "id": "1",
      "type": "input",
      "data": { "label": "Main Topic" }
    },
    {
      "id": "2",
      "data": { "label": "Subtopic 1" }
    }
  ],
  "edges": [
    {
      "id": "e1-2",
      "source": "1",
      "target": "2"
    }
  ]
}

Rules for generation:
1. Each node must have a numeric or simple string id
2. Main topic should be type "input"
3. Leaf nodes should be type "output"
4. The mindmap should be complex and have all the information but easily understandable by students
5. Imagine you are an expert teacher in this field while making this mindmap.
6. You can edit/add/change nodes which you think is right

Use the markdown content below to create the mind map structure:

${markdown}`;

            const response = await apiClient.chatCompletion(
                [
                    {
                        role: "system",
                        content: "You are a mind map generator. Generate only valid JSON with no markdown formatting. The JSON should represent nodes and edges for a flow diagram.",
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                "gpt-4-turbo-2024-04-09",
                800
            );

            return cleanAndParseJSON(response);
        } catch (error) {
            console.error("Error generating mind map structure:", error);
            return {
                nodes: [
                    {
                        id: '1',
                        type: 'input',
                        data: { label: 'Unable to generate structure' }
                    }
                ],
                edges: []
            };
        }
    }, [apiClient]);

    useEffect(() => {
        const generateAndRender = async () => {
            if (!markdown) return;

            setIsLoading(true);
            const mindMapData = await generateMindMapStructure(markdown);

            if (mindMapData) {
                // Add consistent styling to all nodes
                const styledNodes = mindMapData.nodes.map(node => ({
                    ...node,
                    style: {
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        width: 'auto',
                        minWidth: '120px',
                    }
                }));

                // Add consistent styling to all edges
                const styledEdges = mindMapData.edges.map(edge => ({
                    ...edge,
                    type: 'default',
                    markerEnd: { type: MarkerType.ArrowClosed },
                }));

                // Apply Dagre layout
                const layouted = getLayoutedElements(styledNodes, styledEdges);

                setNodes(layouted.nodes);
                setEdges(layouted.edges);

                // Fit view after a brief delay to ensure proper rendering
                setTimeout(() => {
                    fitView({ padding: 0.2 });
                }, 100);
            }

            setIsLoading(false);
        };

        generateAndRender();
    }, [markdown, generateMindMapStructure, setNodes, setEdges, fitView]);

    return (
        <Card className="w-full h-full bg-gray-800 p-4 relative">
            {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <div style={{ width: '100%', height: '100%' }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        proOptions={{ hideAttribution: true }}
                        fitView
                    >
                        <Controls />
                        <Background/>
                    </ReactFlow>
                </div>
            )}
        </Card>
    );
};

// Wrap the component with ReactFlowProvider
const MindMap = (props) => {
    return (
        <ReactFlowProvider>
            <MindMapInner {...props} />
        </ReactFlowProvider>
    );
};

export default MindMap;
