import React, { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node as FlowNode,
  NodeTypes,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { useAppContext } from "./AppContext";
import { Node, Reference } from "./types";

interface NodeData {
  label: string;
  type: string;
}

const nodeTypes: NodeTypes = {};

const Graph: React.FC = () => {
  const { fileData, helpers } = useAppContext();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const buildNode = useCallback(
    (
      nodeId: string,
      processedNodes: Set<string>,
      processedEdges: Set<string>
    ): { nodes: FlowNode<NodeData>[]; edges: Edge[] } => {
      if (processedNodes.has(nodeId)) {
        return { nodes: [], edges: [] };
      }

      const node = helpers.getNodeById(nodeId);
      if (!node) {
        return { nodes: [], edges: [] };
      }

      processedNodes.add(nodeId);

      const flowNode: FlowNode<NodeData> = {
        id: node.id,
        position: { x: 0, y: 0 },
        data: {
          label: node.name,
          type: node.type,
        },
      };

      const references = fileData?.references || [];
      const result: { nodes: FlowNode<NodeData>[]; edges: Edge[] } = {
        nodes: [flowNode],
        edges: [],
      };

      references.forEach((ref: Reference) => {
        if (
          ref.sourceId === nodeId &&
          !processedEdges.has(`${ref.sourceId}-${ref.targetId}`)
        ) {
          processedEdges.add(`${ref.sourceId}-${ref.targetId}`);
          const childResult = buildNode(
            ref.targetId,
            processedNodes,
            processedEdges
          );
          result.nodes.push(...childResult.nodes);
          result.edges.push(
            {
              id: `${ref.sourceId}-${ref.targetId}`,
              source: ref.sourceId,
              target: ref.targetId,
            },
            ...childResult.edges
          );
        }
      });

      return result;
    },
    [fileData?.references, helpers]
  );

  const graphData = useMemo(() => {
    if (!fileData?.nodesById || !fileData?.references) {
      return { nodes: [], edges: [] };
    }

    const processedNodes = new Set<string>();
    const processedEdges = new Set<string>();
    const result: { nodes: FlowNode<NodeData>[]; edges: Edge[] } = {
      nodes: [],
      edges: [],
    };

    Array.from(fileData.nodesById.values()).forEach((node: Node) => {
      const nodeResult = buildNode(node.id, processedNodes, processedEdges);
      result.nodes.push(...nodeResult.nodes);
      result.edges.push(...nodeResult.edges);
    });

    // Position nodes in a grid layout
    const nodesPerRow = Math.ceil(Math.sqrt(result.nodes.length));
    result.nodes.forEach((node, index) => {
      node.position = {
        x: (index % nodesPerRow) * 200,
        y: Math.floor(index / nodesPerRow) * 100,
      };
    });

    return result;
  }, [fileData?.nodesById, fileData?.references, buildNode]);

  React.useEffect(() => {
    setNodes(graphData.nodes);
    setEdges(graphData.edges);
  }, [graphData, setNodes, setEdges]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};

export default Graph;
