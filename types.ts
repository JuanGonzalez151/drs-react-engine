
export interface DataRow {
  [key: string]: string | number | boolean | null;
}

export enum ColumnType {
  NUMERIC = 'Numeric',
  CATEGORICAL = 'Categorical',
  TEXT = 'Text',
  DATE = 'Date',
  UNKNOWN = 'Unknown'
}

export enum SemanticType {
  ID = 'ID',
  CURRENCY = 'Currency',
  TEMPORAL = 'Temporal',
  GEOGRAPHIC = 'Geographic',
  GENERAL = 'General'
}

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  semanticType: SemanticType;
  missingCount: number;
  uniqueCount: number;
  min?: number;
  max?: number;
  mean?: number;
  std?: number;
  exampleValues: string[];
}

export interface DatasetStats {
  rowCount: number;
  columnProfiles: ColumnProfile[];
  outliers: DataRow[];
  narrativeInsights: string[]; // specific string insights (e.g. correlations)
}

// Grounding Metadata
export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChartConfig {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'scatter' | 'pie';
  xAxisKey: string;
  dataKeys: string[];
  description: string;
}

// Self-Modifying Dashboard Elements
export type DashboardElementType = 'header' | 'metric' | 'chart' | 'text';

export interface DashboardElement {
  id: string;
  type: DashboardElementType;
  w: number; // Width (col-span)
  // Content properties vary by type
  title?: string; 
  content?: string; // For header/text
  chartConfig?: ChartConfig; // For charts
  // For metrics
  metricColumn?: string;
  metricOperation?: 'sum' | 'mean' | 'count' | 'max' | 'min';
  metricLabel?: string;
}

// AI Analysis Results
export interface AIAnalysisResult {
  datasetName: string; 
  topic: string; 
  userPersona: string; // Deduced user role based on data
  problemType: 'Classification' | 'Regression' | 'Clustering' | 'Unknown';
  targetVariableSuggestion: string | null;
  summary: string;
  cleaningSuggestions: string[];
  suggestedCharts: ChartConfig[]; // Kept for initial generation
  groundingSources: GroundingSource[]; 
  // New BI Layer Fields
  executiveInsights: string[]; // Critical Trends
  recommendedActions: string[]; // Prescriptive Checklist
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  PROCESSING = 'PROCESSING',
  DASHBOARD = 'DASHBOARD'
}
