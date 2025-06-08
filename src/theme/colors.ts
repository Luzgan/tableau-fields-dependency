// Unified color palette for the Tableau Fields Dependency app
// Organized by semantic, data type, graph, text, background, and border

const colors = {
  // Semantic colors
  error: "#e53935",
  warning: "#fbc02d",
  success: "#43a047",
  info: "#0288d1",

  // Data type colors
  datasource: {
    background: "#fffde7",
    border: "#fbc02d",
  },
  calculation: {
    background: "#fff3e0",
    border: "#fb8c00",
  },
  parameter: {
    background: "#ede7f6",
    border: "#8e24aa",
  },
  measure: {
    background: "#c8e6c9",
    border: "#388e3c",
  },
  dimension: {
    background: "#e3f2fd",
    border: "#1976d2",
  },
  column: {
    background: "#f3e5f5",
    border: "#7e57c2",
  },

  // Graph edges
  edge: {
    direct: "#1976d2", // blue
    indirect: "#fb8c00", // deep orange
  },

  // Text
  text: {
    main: "#222",
    secondary: "#666",
  },

  // Backgrounds
  background: {
    app: "#f5f5f5",
    panel: "#fff",
    graphGrid: "#e0e0e0",
  },

  // Borders
  border: {
    light: "#bdbdbd",
  },
};

export default colors;
