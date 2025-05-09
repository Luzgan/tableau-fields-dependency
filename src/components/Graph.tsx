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
  MarkerType,
} from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";
import { useAppContext } from "./AppContext";
import { Node as AppNode, Reference } from "../types/app.types";

// Extend NodeData from the app's Node type
export type NodeData = AppNode & {
  label: string;
};

const getNodeColors = (type: string) => {
  switch (type) {
    case "datasource":
      return { background: "#e3f2fd", border: "#90caf9" };
    case "calculation":
      return { background: "#fff3e0", border: "#ffb74d" };
    case "parameter":
      return { background: "#ede7f6", border: "#b39ddb" };
    default:
      return { background: "#f5f5f5", border: "#bdbdbd" };
  }
};

const CustomNode = ({ data }: { data: NodeData }) => {
  const { background, border } = getNodeColors(data.type);
  return (
    <div
      style={{
        padding: "10px",
        borderRadius: "5px",
        background,
        border: "1px solid",
        borderColor: border,
        minWidth: "150px",
      }}
      data-testid="node"
      data-node-id={data.id}
    >
      <Handle type="target" position={Position.Top} />
      <div style={{ fontWeight: "bold" }}>{data.label}</div>
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
};

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

interface GraphProps {
  nodeId?: string;
}

const nodeWidth = 200;
const nodeHeight = 80;

const getLayoutedElements = (
  nodes: FlowNode[],
  edges: Edge[],
  direction = "TB"
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;
  });

  return { nodes, edges };
};

const Graph: React.FC<GraphProps> = ({ nodeId }) => {
  const { fileData, helpers } = useAppContext();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Helper to get marker id based on edge color
  const getMarkerId = (color: string) => {
    if (color === "#4caf50") return "arrow-green";
    if (color === "#ff9800") return "arrow-orange";
    return "arrow-default";
  };

  const buildNode = useCallback(
    (
      nodeId: string,
      processedNodes: Set<string>,
      processedEdges: Set<string>,
      depth: number = 0
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
          ...node,
          label: node.displayName,
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
            processedEdges,
            depth + 1
          );
          // Colorblind-friendly, accessible colors
          const directColor = "#1976d2"; // blue
          const indirectColor = "#ffb300"; // amber
          const isDirect = depth === 0;
          const color = isDirect ? directColor : indirectColor;
          result.nodes.push(...childResult.nodes);
          result.edges.push(
            {
              id: `${ref.sourceId}-${ref.targetId}`,
              source: ref.sourceId,
              target: ref.targetId,
              style: {
                stroke: color,
                strokeWidth: 2,
              },
              animated: !isDirect,
              markerEnd: {
                type: MarkerType.Arrow,
                width: 10,
                height: 10,
                color: color,
              },
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

    if (nodeId) {
      // Only show the subgraph for this node
      const nodeResult = buildNode(nodeId, processedNodes, processedEdges, 0);
      result.nodes.push(...nodeResult.nodes);
      result.edges.push(...nodeResult.edges);
    } else {
      // Show the full graph
      Array.from(fileData.nodesById.values()).forEach((node: AppNode) => {
        const nodeResult = buildNode(
          node.id,
          processedNodes,
          processedEdges,
          0
        );
        result.nodes.push(...nodeResult.nodes);
        result.edges.push(...nodeResult.edges);
      });
    }

    // Use Dagre for layout
    return getLayoutedElements(result.nodes, result.edges, "TB");
  }, [fileData?.nodesById, fileData?.references, buildNode, nodeId]);

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
