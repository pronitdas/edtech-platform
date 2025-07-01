'use client'

import React, { useState, useCallback } from 'react'
import {
  User,
  Box,
  FileText,
  Cloud,
  AlertTriangle,
  Database,
  Server,
  Settings,
} from 'lucide-react'
import { Handle, Position } from '@xyflow/react'

import {
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  Node,
  Edge,
  ReactFlowProvider,
  getStraightPath,
  BaseEdge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

const CustomNode = ({ data }: { data: any }) => (
  <>
    <Handle type='target' position={Position.Top} />
    <div
      className={`flex flex-col items-center justify-center rounded-lg p-2 ${data.active ? 'bg-blue-500' : 'bg-gray-200'}`}
    >
      {data.icon}
      <span className='mt-2 text-xs font-semibold'>{data.label}</span>
    </div>
    <Handle type='source' position={Position.Bottom} id='a' />
    <Handle type='source' position={Position.Bottom} id='b' />
  </>
)
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
}: {
  id: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
}) => {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
    </>
  )
}

const nodeTypes = {
  custom: CustomNode,
}
const edgeTypes = {
  'custom-edge': CustomEdge,
}

const initialNodes: Node[] = [
  // Group 1: User Interaction
  {
    id: '1',
    type: 'custom',
    position: { x: 100, y: 100 },
    data: { label: 'User', icon: <User className='h-8 w-8' />, active: false },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 100, y: 200 },
    data: { label: 'Akamai', icon: <Box className='h-8 w-8' />, active: false },
  },
  {
    id: '3',
    type: 'custom',
    position: { x: 250, y: 300 },
    data: {
      label: 'BYOD Service',
      icon: <Server className='h-8 w-8' />,
      active: false,
    },
  },

  {
    id: '4',
    type: 'custom',
    position: { x: 400, y: 300 },
    data: {
      label: 'Tiles API',
      icon: <Cloud className='h-8 w-8' />,
      active: false,
    },
  },
  {
    id: '9',
    type: 'custom',
    position: { x: 400, y: 150 },
    data: {
      label: 'PostgreSQL',
      icon: <Database className='h-8 w-8' />,
      active: false,
    },
  },

  // Group 2: Dat a Handling and Processing
  {
    id: '6',
    type: 'custom',
    position: { x: 600, y: 250 },
    data: { label: 'S3', icon: <Cloud className='h-8 w-8' />, active: false },
  },
  {
    id: '7',
    type: 'custom',
    position: { x: 600, y: 350 },
    data: {
      label: 'CloudWatch',
      icon: <AlertTriangle className='h-8 w-8' />,
      active: false,
    },
  },
  {
    id: '8',
    type: 'custom',
    position: { x: 600, y: 150 },
    data: {
      label: 'Job Queue',
      icon: <Server className='h-8 w-8' />,
      active: false,
    },
  },

  // Group 3: Database and Storage
  {
    id: '10',
    type: 'custom',
    position: { x: 900, y: 250 },
    data: {
      label: 'Airflow',
      icon: <Server className='h-8 w-8' />,
      active: false,
    },
  },
  {
    id: '11',
    type: 'custom',
    position: { x: 900, y: 350 },
    data: {
      label: 'DuckDB',
      icon: <Settings className='h-8 w-8' />,
      active: false,
    },
  },

  // Group 4: Rendering and API Services
  {
    id: '12',
    type: 'custom',
    position: { x: 1100, y: 250 },
    data: {
      label: 'Titiler',
      icon: <Settings className='h-8 w-8' />,
      active: false,
    },
  },
  {
    id: '13',
    type: 'custom',
    position: { x: 1100, y: 350 },
    data: {
      label: 'Tippecanoe',
      icon: <Settings className='h-8 w-8' />,
      active: false,
    },
  },

  // Group 5: Styling and UI Elements
  {
    id: '14',
    type: 'custom',
    position: { x: 1400, y: 50 },
    data: {
      label: 'MBTiles',
      icon: <FileText className='h-8 w-8' />,
      active: false,
    },
  },
  {
    id: '17',
    type: 'custom',
    position: { x: 1400, y: 150 },
    data: {
      label: 'Document',
      icon: <FileText className='h-8 w-8' />,
      active: false,
    },
  },

  {
    id: '15',
    type: 'custom',
    position: { x: 1400, y: 250 },
    data: {
      label: 'Sprites',
      icon: <FileText className='h-8 w-8' />,
      active: false,
    },
  },
  {
    id: '16',
    type: 'custom',
    position: { x: 1400, y: 350 },
    data: {
      label: 'Styles',
      icon: <Settings className='h-8 w-8' />,
      active: false,
    },
  },
]

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3', animated: true },
  { id: 'e3-4', source: '3', target: '4', animated: true },
  { id: 'e4-6', source: '4', target: '6', animated: true },
  { id: 'e5-6', source: '5', target: '6', animated: true },
  { id: 'e8-9', source: '9', target: '8', animated: true },
  { id: 'e9-10', source: '3', target: '9', animated: true },
  { id: 'e10-11', source: '8', target: '10', animated: true },
  { id: 'e11-12', source: '10', target: '14', animated: true },
  { id: 'e12-13', source: '12', target: '13', animated: true },
  { id: 'e14-15', source: '14', target: '15', animated: true },
  { id: 'e15-16', source: '16', target: '15', animated: true },
  { id: 'e6-16', source: '6', target: '16', animated: true },
]
const FLow = () => {
  return (
    <ReactFlowProvider>
      <FlowDiagram />
    </ReactFlowProvider>
  )
}

function FlowDiagram() {
  const [sequence, setSequence] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)

  const [nodes, setNodes] = useState(initialNodes)
  const [edges, setEdges] = useState(initialEdges)
  const onConnect = useCallback(
    (params: any) => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSequence(e.target.value)
  }
  const onNodesChange = useCallback(
    (changes: any) => setNodes(nds => applyNodeChanges(changes, nds)),
    []
  )
  const onEdgesChange = useCallback(
    (changes: any) => setEdges(eds => applyEdgeChanges(changes, eds)),
    []
  )
  const resetNodes = useCallback(() => {
    setNodes(nds =>
      nds.map(node => ({ ...node, data: { ...node.data, active: false } }))
    )
  }, [setNodes])

  const executeProgram = useCallback(() => {
    if (isExecuting) return

    const sequenceArray = sequence.split(',').map(id => id.trim())
    setIsExecuting(true)
    resetNodes()

    sequenceArray.forEach((nodeId, index) => {
      setTimeout(() => {
        setNodes(nds =>
          nds.map(node =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, active: true } }
              : node
          )
        )
        if (index === sequenceArray.length - 1) {
          setIsExecuting(false)
        }
      }, index * 1000)
    })
  }, [sequence, setNodes, resetNodes, isExecuting])

  return (
    <div className='flex h-screen w-full flex-col'>
      <div className='p-4 dark:bg-gray-800'>
        <div className='flex items-center space-x-4'>
          <div className='flex-grow'>
            <label
              htmlFor='sequence'
              className='text-sm font-medium text-gray-700 dark:text-gray-300'
            >
              Enter sequence (e.g., 1,2,3)
            </label>
            <input
              id='sequence'
              type='text'
              className='mt-1'
              value={sequence}
              onChange={handleInputChange}
              placeholder='Enter sequence (e.g., 1,2,3)'
            />
          </div>
          <button
            onClick={executeProgram}
            disabled={isExecuting}
            className='mt-6'
          >
            {isExecuting ? 'Executing...' : 'Execute Program'}
          </button>
        </div>
      </div>
      <div style={{ height: 800 }} className='flex-grow'>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  )
}

export default FLow
