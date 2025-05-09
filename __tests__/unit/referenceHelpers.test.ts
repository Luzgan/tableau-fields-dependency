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

  it("does not return duplicate nodes in direct or indirect results", () => {
    // A -> B, A -> B (duplicate direct)
    // A -> C -> D, A -> C -> D (duplicate indirect)
    const nodes = new Map<string, Node>([
      ["A", createTestNode("A", "Node A")],
      ["B", createTestNode("B", "Node B")],
      ["C", createTestNode("C", "Node C")],
      ["D", createTestNode("D", "Node D")],
    ]);
    const references: Reference[] = [
      createTestReference("A", "B"),
      createTestReference("A", "B"), // duplicate direct
      createTestReference("A", "C"),
      createTestReference("C", "D"),
      createTestReference("A", "C"), // duplicate path to C
      createTestReference("C", "D"), // duplicate indirect
    ];
    const fileData: FileData = {
      filename: "test.twb",
      nodesById: nodes,
      references,
    };
    // Direct referenced nodes should only have B and C once
    const direct = getReferencedNodes(fileData, "A");
    expect(direct.map((n) => n.id).sort()).toEqual(["B", "C"].sort());
    expect(new Set(direct.map((n) => n.id)).size).toBe(direct.length);
    // Indirect referenced nodes should only have D once
    const indirect = getIndirectReferencedNodes(fileData, "A");
    expect(indirect.map((n) => n.id)).toEqual(["D"]);
    expect(new Set(indirect.map((n) => n.id)).size).toBe(indirect.length);
  });

  it("allows a node to appear in both direct and indirect if appropriate, but not more than once in each", () => {
    // A -> B, A -> C, B -> D, C -> D, D -> B (cycle)
    // D is both direct and indirect referenced from A
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
      createTestReference("D", "B"),
    ];
    const fileData: FileData = {
      filename: "test.twb",
      nodesById: nodes,
      references,
    };
    const direct = getReferencedNodes(fileData, "A");
    const indirect = getIndirectReferencedNodes(fileData, "A");
    // D should be in both, but only once in each
    expect(direct.map((n) => n.id)).toContain("B");
    expect(direct.map((n) => n.id)).toContain("C");
    expect(indirect.map((n) => n.id)).toContain("D");
    expect(new Set(direct.map((n) => n.id)).size).toBe(direct.length);
    expect(new Set(indirect.map((n) => n.id)).size).toBe(indirect.length);
  });
});
