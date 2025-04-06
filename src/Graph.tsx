import React, { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node as FlowNode,
  NodeTypes,
  useEdgesState,
  useNodesState,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { useAppContext } from "./AppContext";
import { Node, Reference } from "./types";

interface NodeData {
  label: string;
  type: string;
  caption?: string;
  id: string;
}

const CustomNode = ({ data }: { data: NodeData }) => (
  <div
    style={{
      padding: "10px",
      borderRadius: "5px",
      background: data.type === "column" ? "#e3f2fd" : "#fff3e0",
      border: "1px solid",
      borderColor: data.type === "column" ? "#90caf9" : "#ffb74d",
      minWidth: "150px",
    }}
    data-testid="node"
    data-node-id={data.id}
  >
    <Handle type="target" position={Position.Top} />
    <div style={{ fontWeight: "bold" }}>{data.label}</div>
    {data.caption && (
      <div style={{ fontSize: "0.8em", color: "#666" }}>{data.caption}</div>
    )}
    <div
      style={{
        fontSize: "0.8em",
        color: "#666",
        fontStyle: "italic",
        marginTop: "4px",
      }}
    >
      {data.type}
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

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
        type: "custom",
        position: { x: 0, y: 0 },
        data: {
          label: node.displayName,
          type: node.type,
          caption: node.caption,
          id: node.id,
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
              style: {
                stroke: ref.type === "direct" ? "#4caf50" : "#ff9800",
                strokeWidth: 2,
              },
              animated: ref.type === "indirect",
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
        x: (index % nodesPerRow) * 250,
        y: Math.floor(index / nodesPerRow) * 150,
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
        minZoom={0.1}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { strokeWidth: 2 },
        }}
      >
        <Controls />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div>
  );
};

export default Graph;
