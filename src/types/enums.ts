export enum ColumnDataType {
  String = "string",
  Integer = "integer",
  Real = "real",
  Boolean = "boolean",
  Date = "date",
  DateTime = "datetime",
  Spatial = "spatial",
  Table = "table", // Used by internal Tableau columns
}

export enum ColumnRole {
  Dimension = "dimension",
  Measure = "measure",
}

export enum ColumnAggregationType {
  None = "none",
  Sum = "sum",
  Average = "avg",
  Min = "min",
  Max = "max",
  Count = "count",
  CountD = "countd",
  Median = "median",
  Percentile = "percentile",
  Custom = "custom",
}
