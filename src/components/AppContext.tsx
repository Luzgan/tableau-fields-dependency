import React, { createContext, useContext, useState } from "react";
import { FileData, Node, Reference } from "../types/app.types";

interface AppContextType {
  fileData: FileData | null;
  setFileData: (data: FileData | null) => void;
  helpers: {
    getNodes: () => Node[];
    getNodeById: (id: string) => Node | undefined;
    getReferencesForNode: (nodeId: string) => Reference[];
    getReferencingNodes: (nodeId: string) => Node[];
    getReferencedNodes: (nodeId: string) => Node[];
  };
}

export const AppContext = createContext<AppContextType>({
  fileData: null,
  setFileData: () => {},
  helpers: {
    getNodes: () => [],
    getNodeById: () => undefined,
    getReferencesForNode: () => [],
    getReferencingNodes: () => [],
    getReferencedNodes: () => [],
  },
});

export const useAppContext = () => useContext(AppContext);

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [fileData, setFileData] = useState<FileData | null>(null);

  const helpers = {
    getNodes: () => {
      if (!fileData?.nodesById) return [];
      return Array.from(fileData.nodesById.values());
    },

    getNodeById: (id: string) => {
      return fileData?.nodesById?.get(id);
    },

    getReferencesForNode: (nodeId: string) => {
      if (!fileData?.references) return [];
      return fileData.references.filter(
        (ref) => ref.sourceId === nodeId || ref.targetId === nodeId
      );
    },

    getReferencingNodes: (nodeId: string) => {
      if (!fileData?.references || !fileData.nodesById) return [];
      const referencingNodeIds = fileData.references
        .filter((ref) => ref.targetId === nodeId)
        .map((ref) => ref.sourceId);
      const nodes = referencingNodeIds
        .map((id) => fileData.nodesById.get(id))
        .filter((node): node is Node => {
          if (!node) return false;
          return "id" in node && "name" in node && "type" in node;
        });
      return nodes;
    },

    getReferencedNodes: (nodeId: string) => {
      if (!fileData?.references || !fileData.nodesById) return [];
      const referencedNodeIds = fileData.references
        .filter((ref) => ref.sourceId === nodeId)
        .map((ref) => ref.targetId);
      const nodes = referencedNodeIds
        .map((id) => fileData.nodesById.get(id))
        .filter((node): node is Node => {
          if (!node) return false;
          return "id" in node && "name" in node && "type" in node;
        });
      return nodes;
    },
  };

  const value: AppContextType = {
    fileData,
    setFileData,
    helpers,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
