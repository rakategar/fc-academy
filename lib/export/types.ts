export interface ReportColumn { key: string; label: string; align?: "left" | "right" | "center"; width?: number }
export interface Report {
  title: string;
  subtitle: string;
  filename: string;
  columns: ReportColumn[];
  rows: Record<string, string | number | null>[];
  summary?: { label: string; value: string }[];
  generatedAt: string;
  generatedBy: string;
}
