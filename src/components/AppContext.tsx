import React, { createContext, useContext, useState } from "react";
import { FileData, Node, Reference } from "../types/app.types";
import {
  getReferencingNodes,
  getReferencedNodes,
  getIndirectReferencingNodes,
  getIndirectReferencedNodes,
} from "../utils/referenceHelpers";

interface AppContextType {
  fileData: FileData | null;
  setFileData: (data: FileData | null) => void;
  helpers: {
    getNodes: () => Node[];
    getNodeById: (id: string) => Node | undefined;
    getReferencesForNode: (nodeId: string) => Reference[];
    getReferencingNodes: (nodeId: string) => Node[];
    getReferencedNodes: (nodeId: string) => Node[];
    getIndirectReferencingNodes: (nodeId: string) => Node[];
    getIndirectReferencedNodes: (nodeId: string) => Node[];
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
    getIndirectReferencingNodes: () => [],
    getIndirectReferencedNodes: () => [],
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
      if (!fileData) return [];
      return getReferencingNodes(fileData, nodeId);
    },

    getReferencedNodes: (nodeId: string) => {
      if (!fileData) return [];
      return getReferencedNodes(fileData, nodeId);
    },

    getIndirectReferencingNodes: (nodeId: string) => {
      if (!fileData) return [];
      return getIndirectReferencingNodes(fileData, nodeId);
    },

    getIndirectReferencedNodes: (nodeId: string) => {
      if (!fileData) return [];
      return getIndirectReferencedNodes(fileData, nodeId);
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
