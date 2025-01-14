import React from "react";
import {
  Background,
  ReactFlow,
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import * as _ from "lodash";
import { useParams } from "react-router-dom";
import { getFieldName } from "./utils";

const buildNode = (node, data, offsetX = 0, offsetY = 0) => {
  const nodes = [];
  const edges = [];
  const nodeAlreadyExists =
    nodes.find((existingNode) => existingNode.id === node.id) !== undefined;
  if (!nodeAlreadyExists) {
    nodes.push({
      id: node.id,
      data: { label: getFieldName(node) },
      position: { x: offsetX, y: offsetY },
      sourcePosition: "right",
      targetPosition: "left",
      style: {
        width: "100px",
        padding: "4px",
        height: "22px",
        fontSize: "8px",
        overflow: "hidden",
      },
    });
  }

  let numberOfConnections = 0;
  for (const link of data.links) {
    if (link.source === node.id) {
      const edgeAlreadyExists =
        edges.find(
          (existingEdge) =>
            existingEdge.source === link.source &&
            existingEdge.target === link.target
        ) !== undefined;

      if (!edgeAlreadyExists) {
        edges.push({
          id: `edge-${node.id}-${link.target}`,
          source: link.source,
          target: link.target,
        });
        numberOfConnections++;
      }

      if (!nodeAlreadyExists) {
        const innerNode = buildNode(
          data.nodes.find((node) => node.id === link.target),
          data,
          offsetX + 150,
          (numberOfConnections - 1) * 60
        );

        nodes.push(...innerNode.nodes);
        edges.push(...innerNode.edges);
      }
    }
  }

  return {
    nodes: _.uniqBy(nodes, "id"),
    edges: _.uniqBy(
      edges,
      (existingEdge) => existingEdge.source + " " + existingEdge.target
    ),
  };
};

const Graph = ({ data }) => {
  const { fieldId } = useParams();
  const selectedField = data.nodes.find((node) => node.id === fieldId);

  const graph = buildNode(selectedField, data);

  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      height={"100%"}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodesConnectable={false}
      nodesDraggable={false}
      nodesFocusable={false}
      fitView
      style={{ backgroundColor: "#F7F9FB" }}
    >
      <MiniMap />
      <Controls />
      <Background />
    </ReactFlow>
  );
};

export default Graph;
