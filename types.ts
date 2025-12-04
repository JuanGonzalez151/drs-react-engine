
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

// Advanced Analytics Types
export interface RegressionResult {
  xColumn: string;
  yColumn: string;
  slope: number;
  intercept: number;
  rSquared: number;
  equation: string;
  trendline: { x: number; y: number }[];
}

export interface MonteCarloResult {
  column: string;
  p10: number; // Pessimistic
  p50: number; // Expected
  p90: number; // Optimistic
  iterations: number;
  mean: number;
  std: number;
}

export interface AdvancedStats {
  regression?: RegressionResult;
  monteCarlo?: MonteCarloResult;
}

export interface DatasetStats {
  rowCount: number;
  columnProfiles: ColumnProfile[];
  outliers: DataRow[];
  narrativeInsights: string[]; // specific string insights (e.g. correlations)
  advancedStats?: AdvancedStats;
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

// Mission Configuration
export interface MissionSettings {
  enableGrounding: boolean;
  deepScan: boolean;
  predictiveModeling: boolean; 
  forcePersona: string;
  analysisGoal: string; // New Setting
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

// Radio / System Response Types
export interface SystemActionLog {
  actionTaken: string;
  scope: string;
  newAnalysisState: string;
}

export interface RadioResponse {
  chatResponse: string;
  systemLog: SystemActionLog | null;
  updatedLayout?: DashboardElement[]; // Optional, only if command modifies UI
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  CONFIG = 'CONFIG',
  PROCESSING = 'PROCESSING',
  DASHBOARD = 'DASHBOARD'
}
