"use client";

import ReactECharts from "echarts-for-react";

export interface MetricChartPoint {
  timestamp: string;
  value: number;
}

export interface MetricChartProps {
  title: string;
  unit?: string;
  data: MetricChartPoint[];
  height?: number;
}

export function MetricChart({ title, unit, data, height = 260 }: MetricChartProps) {
  const option = {
    title: { text: title, textStyle: { fontSize: 13, fontWeight: 500 } },
    tooltip: {
      trigger: "axis" as const,
      valueFormatter: (value: unknown) => `${value}${unit ? ` ${unit}` : ""}`,
    },
    grid: { left: 48, right: 16, top: 40, bottom: 40 },
    xAxis: { type: "time" as const },
    yAxis: {
      type: "value" as const,
      axisLabel: { formatter: (value: number) => `${value}${unit ?? ""}` },
    },
    dataZoom: [{ type: "inside" as const }, { type: "slider" as const, height: 16, bottom: 4 }],
    series: [
      {
        type: "line" as const,
        showSymbol: false,
        smooth: true,
        data: data.map((point) => [point.timestamp, point.value]),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} notMerge />;
}
