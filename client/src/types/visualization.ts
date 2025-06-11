export type ChartType = 'bar' | 'line' | 'scatter' | 'pie' | 'heatmap';

export interface VisualizationConfig {
  type: ChartType;
  xAxis: string;
  yAxis: string;
  colorBy?: string;
}

export interface ChartOptions {
  width?: number;
  height?: number;
  padding?: number;
  title?: string;
  description?: string;
} 