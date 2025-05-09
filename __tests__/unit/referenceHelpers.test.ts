import {
  getReferencingNodes,
  getReferencedNodes,
  getIndirectReferencingNodes,
  getIndirectReferencedNodes,
} from "../../src/utils/referenceHelpers";
import { FileData, Node, Reference } from "../../src/types/app.types";
import { ColumnDataType, ColumnRole } from "../../src/types/enums";

describe("referenceHelpers", () => {
  // Helper to create a test datasource node
  const createTestNode = (id: string, name: string): Node => ({
    id,
    name,
    type: "datasource",
    dataType: ColumnDataType.String,
    role: ColumnRole.Dimension,
    displayName: name,
    datasourceName: "TestDS",
  });

  // Helper to create a test reference
  const createTestReference = (
    sourceId: string,
    targetId: string,
    type: "direct" | "indirect" = "direct"
  ): Reference => ({
    sourceId,
    targetId,
    type,
    matchedText: `[${sourceId}]`,
    targetName: targetId,
  });

  it("finds direct referencing and referenced nodes", () => {
    const nodes = new Map<string, Node>([
      ["A", createTestNode("A", "Node A")],
      ["B", createTestNode("B", "Node B")],
      ["C", createTestNode("C", "Node C")],
    ]);
    const references: Reference[] = [
      createTestReference("B", "A"),
      createTestReference("C", "A"),
      createTestReference("A", "C"),
    ];
    const fileData: FileData = {
      filename: "test.twb",
      nodesById: nodes,
      references,
    };

    expect(
      getReferencingNodes(fileData, "A")
        .map((n) => n.id)
        .sort()
    ).toEqual(["B", "C"].sort());
    expect(getReferencedNodes(fileData, "A").map((n) => n.id)).toEqual(["C"]);
  });

  it("finds indirect referencing nodes", () => {
    // A <- B <- C <- D
    const nodes = new Map<string, Node>([
      ["A", createTestNode("A", "Node A")],
      ["B", createTestNode("B", "Node B")],
      ["C", createTestNode("C", "Node C")],
      ["D", createTestNode("D", "Node D")],
    ]);
    const references: Reference[] = [
      createTestReference("B", "A"),
      createTestReference("C", "B"),
      createTestReference("D", "C"),
    ];
    const fileData: FileData = {
      filename: "test.twb",
      nodesById: nodes,
      references,
    };
    expect(
      getIndirectReferencingNodes(fileData, "A")
        .map((n) => n.id)
        .sort()
    ).toEqual(["C", "D"].sort());
  });

  it("finds indirect referenced nodes", () => {
    // A -> B -> C -> D
    const nodes = new Map<string, Node>([
      ["A", createTestNode("A", "Node A")],
      ["B", createTestNode("B", "Node B")],
      ["C", createTestNode("C", "Node C")],
      ["D", createTestNode("D", "Node D")],
    ]);
    const references: Reference[] = [
      createTestReference("A", "B"),
      createTestReference("B", "C"),
      createTestReference("C", "D"),
    ];
    const fileData: FileData = {
      filename: "test.twb",
      nodesById: nodes,
      references,
    };
    expect(
      getIndirectReferencedNodes(fileData, "A")
        .map((n) => n.id)
        .sort()
    ).toEqual(["C", "D"].sort());
  });

  it("handles circular references without infinite loops", () => {
    // A -> B -> C -> A
    const nodes = new Map<string, Node>([
      ["A", createTestNode("A", "Node A")],
      ["B", createTestNode("B", "Node B")],
      ["C", createTestNode("C", "Node C")],
    ]);
    const references: Reference[] = [
      createTestReference("A", "B"),
      createTestReference("B", "C"),
      createTestReference("C", "A"),
    ];
    const fileData: FileData = {
      filename: "test.twb",
      nodesById: nodes,
      references,
    };
    // Only C is an indirect reference from A (A->B->C)
    expect(getIndirectReferencedNodes(fileData, "A").map((n) => n.id)).toEqual([
      "C",
    ]);
    // Only B is an indirect reference to C (C<-A<-B)
    expect(getIndirectReferencingNodes(fileData, "C").map((n) => n.id)).toEqual(
      ["A"]
    );
  });

  it("handles multiple paths to the same node", () => {
    // A -> B -> D, A -> C -> D
    const nodes = new Map<string, Node>([
      ["A", createTestNode("A", "Node A")],
      ["B", createTestNode("B", "Node B")],
      ["C", createTestNode("C", "Node C")],
      ["D", createTestNode("D", "Node D")],
    ]);
    const references: Reference[] = [
      createTestReference("A", "B"),
      createTestReference("A", "C"),
      createTestReference("B", "D"),
      createTestReference("C", "D"),
    ];
    const fileData: FileData = {
      filename: "test.twb",
      nodesById: nodes,
      references,
    };
    // D should only appear once as an indirect reference
    expect(getIndirectReferencedNodes(fileData, "A").map((n) => n.id)).toEqual([
      "D",
    ]);
  });

  it("handles deep reference chains", () => {
    // A -> B -> C -> D -> E -> F
    const nodes = new Map<string, Node>([
      ["A", createTestNode("A", "Node A")],
      ["B", createTestNode("B", "Node B")],
      ["C", createTestNode("C", "Node C")],
      ["D", createTestNode("D", "Node D")],
      ["E", createTestNode("E", "Node E")],
      ["F", createTestNode("F", "Node F")],
    ]);
    const references: Reference[] = [
      createTestReference("A", "B"),
      createTestReference("B", "C"),
      createTestReference("C", "D"),
      createTestReference("D", "E"),
      createTestReference("E", "F"),
    ];
    const fileData: FileData = {
      filename: "test.twb",
      nodesById: nodes,
      references,
    };
    expect(
      getIndirectReferencedNodes(fileData, "A")
        .map((n) => n.id)
        .sort()
    ).toEqual(["C", "D", "E", "F"].sort());
  });
});
