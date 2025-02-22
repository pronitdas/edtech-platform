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
    Panel,
} from '@xyflow/react';
import Dagre from '@dagrejs/dagre';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Copy, Trash2, Edit } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import useAuthState from '@/hooks/useAuth';
import { OpenAIClient } from '@/services/openAi';

import '@xyflow/react/dist/style.css';

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: direction, ranksep: 80, nodesep: 40 });

    edges.forEach((edge) => g.setEdge(edge.source, edge.target));
    nodes.forEach((node) => {
        const width = 230;
        const height = 60;
        g.setNode(node.id, { width, height });
    });

    Dagre.layout(g);

    const layoutedNodes = nodes.map((node) => {
        const position = g.node(node.id);
        return {
            ...node,
            position: {
                x: position.x - 10,
                y: position.y - 10,
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
    const [selectedNode, setSelectedNode] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editLabel, setEditLabel] = useState('');
    const { oAiKey } = useAuthState();
    const [apiClient, setApiClient] = useState(null);
    const { fitView, getNode, getNodes, getEdges, deleteElements, addNodes, addEdges } = useReactFlow();

    const onConnect = useCallback(
        (connection) => {
            setEdges((oldEdges) => addEdge(connection, oldEdges));
        },
        [setEdges],
    );

    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
    }, []);

    const handleAddNode = useCallback(() => {
        const newNodeId = `node-${getNodes().length + 1}`;
        const parentNode = selectedNode || getNodes()[0];

        if (!parentNode) return;

        const newNode = {
            id: newNodeId,
            data: { label: 'New Topic' },
            position: { x: parentNode.position.x + 200, y: parentNode.position.y },
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
        };

        const newEdge = {
            id: `edge-${parentNode.id}-${newNodeId}`,
            source: parentNode.id,
            target: newNodeId,
            type: 'default',
            markerEnd: { type: MarkerType.ArrowClosed },
        };

        addNodes(newNode);
        addEdges(newEdge);

    }, [selectedNode, getNodes, addNodes, addEdges, getEdges, setNodes, setEdges, fitView]);

    const handleCopyNode = useCallback(() => {
        if (!selectedNode) return;

        const newNodeId = `node-${getNodes().length + 1}`;
        const newNode = {
            ...selectedNode,
            id: newNodeId,
            position: {
                x: selectedNode.position.x + 100,
                y: selectedNode.position.y + 100,
            }
        };

        addNodes(newNode);

    }, [selectedNode, getNodes, addNodes, getEdges, setNodes, setEdges, fitView]);

    const handleDeleteNode = useCallback(() => {
        if (!selectedNode) return;

        const connectedEdges = getEdges().filter(
            edge => edge.source === selectedNode.id || edge.target === selectedNode.id
        );

        deleteElements({
            nodes: [selectedNode],
            edges: connectedEdges,
        });

        setSelectedNode(null);

    }, [selectedNode, getEdges, deleteElements, getNodes, setNodes, setEdges, fitView]);

    const handleEditNode = useCallback(() => {
        if (!selectedNode) return;
        setEditLabel(selectedNode.data.label);
        setIsEditDialogOpen(true);
    }, [selectedNode]);

    const handleSaveEdit = useCallback(() => {
        if (!selectedNode || !editLabel.trim()) return;

        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNode.id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            label: editLabel.trim(),
                        },
                    };
                }
                return node;
            })
        );

        setIsEditDialogOpen(false);
        setEditLabel('');
    }, [selectedNode, editLabel, setNodes]);

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
                        onNodeClick={onNodeClick}
                        proOptions={{ hideAttribution: true }}
                        fitView
                    >
                        <Controls />
                        <Background />
                        <Panel position="top-right" className="flex gap-1">
                            <Button
                                onClick={handleAddNode}
                                variant="secondary"
                                className="flex items-center"
                                disabled={!nodes.length}
                            >
                                <Plus className="h-1 w-1" />
                            </Button>
                            <Button
                                onClick={handleCopyNode}
                                variant="secondary"
                                className="flex items-center"
                                disabled={!selectedNode}
                            >
                                <Copy className="h-1 w-1" />
                            </Button>
                            <Button
                                onClick={handleEditNode}
                                variant="secondary"
                                className="flex items-center"
                                disabled={!selectedNode}
                            >
                                <Edit className="h-1 w-1" />
                            </Button>
                            <Button
                                onClick={handleDeleteNode}
                                variant="destructive"
                                className="flex items-center"
                                disabled={!selectedNode}
                            >
                                <Trash2 className="h-1 w-1" />
                            </Button>
                        </Panel>
                    </ReactFlow>

                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Node</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <Input
                                    value={editLabel}
                                    onChange={(e) => setEditLabel(e.target.value)}
                                    placeholder="Enter node label"
                                    className="w-full"
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleSaveEdit}>Save</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </Card>
    );
};

const MindMap = (props) => {
    return (
        <ReactFlowProvider>
            <MindMapInner {...props} />
        </ReactFlowProvider>
    );
};

export default MindMap;
