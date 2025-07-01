import { apiClient } from './api-client'

interface GraphNode {
  id?: string
  labels: string[]
  properties: { [key: string]: any }
}

interface GraphRelationship {
  id?: string
  start_node_id: string
  end_node_id: string
  type: string
  properties?: { [key: string]: any }
}

interface GraphQueryResult {
  nodes: GraphNode[]
  relationships: GraphRelationship[]
  summary?: { [key: string]: any }
}

export class BackendNeo4jService {
  async getNodeById(nodeId: string): Promise<GraphNode> {
    return apiClient.get<GraphNode>(`/neo4j/node/${nodeId}`)
  }

  async getRelatedNodes(
    nodeId: string,
    relationshipType?: string,
    direction?: 'INCOMING' | 'OUTGOING' | 'BOTH'
  ): Promise<GraphQueryResult> {
    const params = new URLSearchParams()
    if (relationshipType) params.append('relationship_type', relationshipType)
    if (direction) params.append('direction', direction)
    return apiClient.get<GraphQueryResult>(
      `/neo4j/related/${nodeId}?${params.toString()}`
    )
  }

  async getKnowledgeGraph(knowledgeId: number): Promise<GraphQueryResult> {
    return apiClient.get<GraphQueryResult>(
      `/neo4j/knowledge_graph/${knowledgeId}`
    )
  }

  async buildKnowledgeGraph(
    knowledgeId: number,
    chapters: any[]
  ): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      `/neo4j/build_graph?knowledge_id=${knowledgeId}`,
      chapters
    )
  }
}

export const backendNeo4jService = new BackendNeo4jService()
