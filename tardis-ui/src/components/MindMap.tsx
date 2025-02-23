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
import { generateMindMapStructure } from '@/services/openAiFns';

import '@xyflow/react/dist/style.css';

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

const MindMapInner = (props) => {
    const { nodes: ogNodes, edges: ogEdges } = JSON.parse(props.markdown);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [error, setError] = useState<string | null>(null);
    const { oAiKey } = useAuthState();
    const [apiClient, setApiClient] = useState<OpenAIClient | null>(null);
    const { fitView } = useReactFlow();
    const onConnect = useCallback((connection) => {
        setEdges((oldEdges) => addEdge(connection, oldEdges));
    }, [setEdges]);

    useEffect(() => {
        if (!apiClient && oAiKey) {
            setApiClient(new OpenAIClient(oAiKey));
        }
    }, [oAiKey, apiClient]);

    useEffect(() => {
        if (!props) return;
        setError(null);
        try {
            console.log("hi")
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

            setTimeout(() => fitView({ padding: 0.2 }), 100);
        } catch (err) {
            setError('Failed to generate mind map');
            console.error(err);
        }
    }, [nodes, edges, setNodes, setEdges, fitView]);

    return (
        <Card className="w-full h-full bg-gray-800 p-4 relative">

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
                    <Background color="#374151" gap={16} />
                </ReactFlow>
            </div>
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
