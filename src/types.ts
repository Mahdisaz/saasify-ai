export type Language = 'en' | 'es' | 'de' | 'fr' | 'ja' | 'zh';

export interface Expense {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  cost: number;
  utilization: number; // 0 to 100
  recommendationKey: string; // To translate dynamically
  recommendationParam?: string; // e.g. "$40"
  isOptimized: boolean;
}

export interface MetricCardData {
  titleKey: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  glowColor: string; // 'blue' | 'purple' | 'green' | 'amber'
}

export interface ChartDataPoint {
  month: string;
  spend: number;
  optimizedSpend: number;
}
