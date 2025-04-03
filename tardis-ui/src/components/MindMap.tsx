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
        minWidth: '150px',
    }
};

// React Flow container styles
const reactFlowStyles: React.CSSProperties = {
    background: '#1f2937',
};

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    g.setGraph({ 
        rankdir: direction, 
        ranksep: 80,
        nodesep: 50,
        marginx: 20,
        marginy: 20
    });

    edges.forEach((edge) => g.setEdge(edge.source, edge.target));
    nodes.forEach((node) => {
        g.setNode(node.id, { width: 150, height: 40 });
    });

    Dagre.layout(g);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = g.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - 75, // Half the width
                y: nodeWithPosition.y - 20  // Half the height
            }
        };
    });

    return {
        nodes: layoutedNodes,
        edges
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
            console.error(err);
            setIsLoading(false);
        }
    }, [props, initialized, fitView, setNodes, setEdges]);

    // Fix for the React Flow container size issue
    const rfWrapper: React.CSSProperties = {
        width: '100%',
        height: 'calc(100vh - 200px)', // Adjust for header and padding
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    };

    if (isLoading) return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-300">Generating mind map...</span>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center h-full">
            <div className="text-center">
                <div className="text-red-500 mb-2">Error: {error}</div>
                <Button onClick={() => setInitialized(false)}>Retry</Button>
            </div>
        </div>
    );

    return (
        <Card className="w-full h-full overflow-hidden">
            <div style={rfWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    proOptions={{ hideAttribution: true }}
                    style={reactFlowStyles}
                    minZoom={0.2}
                    maxZoom={1.5}
                    defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    nodesDraggable={true}
                    elementsSelectable={true}
                    zoomOnScroll={true}
                    panOnScroll={true}
                    preventScrolling={false}
                    nodeOrigin={[0.5, 0.5]}
                >
                    <Background color="#334155" gap={16} />
                    <Controls 
                        className="bg-gray-800 p-2 rounded-lg border border-gray-700 [&>button]:bg-gray-700 [&>button]:border-0 [&>button]:text-white [&>button:hover]:bg-gray-600"
                    />
                    <Panel position="top-right" className="bg-gray-800 p-2 rounded-md shadow space-x-1 flex">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleAddNode}
                            disabled={!selectedNode}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCopyNode}
                            disabled={!selectedNode}
                        >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleEditNode}
                            disabled={!selectedNode}
                        >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleDeleteNode}
                            disabled={!selectedNode}
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                        </Button>
                    </Panel>
                </ReactFlow>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Node</DialogTitle>
                    </DialogHeader>
                    <Input
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        placeholder="Node text"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEdit}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

const MindMap = (props) => {
    const rfWrapper: React.CSSProperties = {
        width: '100%',
        height: 'calc(100vh - 200px)', // Adjust for header and padding
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <div style={rfWrapper}>
                <ReactFlowProvider>
                    <MindMapInner {...props} />
                </ReactFlowProvider>
            </div>
        </div>
    );
};

export default MindMap;
