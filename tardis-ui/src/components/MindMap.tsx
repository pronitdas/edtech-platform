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
import { generateMindMapStructure } from '@/services/openAiFns';

import '@xyflow/react/dist/style.css';

const NODE_STYLES = {
    input: {
        background: '#2563eb',
        color: 'white',
    },
    default: {
        background: '#4b5563',
        color: 'white',
    },
    output: {
        background: '#059669',
        color: 'white',
    },
    common: {
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

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: direction, ranksep: 80, nodesep: 40 });

    edges.forEach((edge) => g.setEdge(edge.source, edge.target));
    nodes.forEach((node) => {
        const width = 180;
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

const MindMapInner = (props) => {
    const { markdown } = props;
    const { nodes: ogNodes, edges: ogEdges } = JSON.parse(markdown);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editLabel, setEditLabel] = useState('');

    const { oAiKey } = useAuthState();
    const [apiClient, setApiClient] = useState(null);
    const { fitView, getNode, getNodes, getEdges, deleteElements, addNodes, addEdges } = useReactFlow();

    const onConnect = useCallback(
        (connection) => {
            const newEdge = {
                ...connection,
                animated: true,
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { stroke: '#64748b' }
            };
            setEdges((oldEdges) => addEdge(newEdge, oldEdges));
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
                ...NODE_STYLES.common,
                ...NODE_STYLES.input
            }
        };

        const newEdge = {
            id: `edge-${parentNode.id}-${newNodeId}`,
            source: parentNode.id,
            target: newNodeId,
            type: 'default',
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#64748b' },
            animated: true
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

    // Initialize API client
    useEffect(() => {
        if (!apiClient && oAiKey) {
            setApiClient(new OpenAIClient(oAiKey));
        }
    }, [oAiKey, apiClient]);

    // Initialize the mind map (once)
    useEffect(() => {
        if (!props || initialized) return;

        setError(null);
        setIsLoading(true);

        try {
            const styledNodes = ogNodes.map(node => ({
                ...node,
                style: {
                    ...NODE_STYLES.common,
                    ...NODE_STYLES[node.type || 'default']
                }
            }));

            const styledEdges = ogEdges.map(edge => ({
                ...edge,
                animated: true,
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { stroke: '#64748b' }
            }));

            const layouted = getLayoutedElements(styledNodes, styledEdges);
            setNodes(layouted.nodes);
            setEdges(layouted.edges);
            setInitialized(true);
            setIsLoading(false);

            setTimeout(() => fitView({ padding: 0.2 }), 100);
        } catch (err) {
            setError('Failed to generate mind map');
            setIsLoading(false);
            console.error(err);
        }
    }, [props, fitView, setNodes, setEdges]);

    return (
        <Card className="w-full h-full bg-gray-800 p-4 relative">
            {error && <div className="text-red-500 absolute top-2 left-2 z-10">{error}</div>}

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
                        <Background gap={16} />
                        <Panel position="top-right" className="flex gap-2">
                            <Button
                                onClick={handleAddNode}
                                variant="secondary"
                                className="flex items-center gap-2"
                                disabled={!nodes.length}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                                onClick={handleCopyNode}
                                variant="secondary"
                                className="flex items-center gap-2"
                                disabled={!selectedNode}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                                onClick={handleEditNode}
                                variant="secondary"
                                className="flex items-center gap-2"
                                disabled={!selectedNode}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                onClick={handleDeleteNode}
                                variant="destructive"
                                className="flex items-center gap-2"
                                disabled={!selectedNode}
                            >
                                <Trash2 className="h-4 w-4" />
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

// Wrap the component with ReactFlowProvider
const MindMap = (props) => {
    return (
        <ReactFlowProvider>
            <MindMapInner {...props} />
        </ReactFlowProvider>
    );
};

export default MindMap;
