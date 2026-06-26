"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { ChartCardData } from "@/lib/genui/types"
import { CHART_COLORS } from "@/lib/genui/chart-colors"
import { getCardTitle } from "@/lib/genui/card-meta"
import { CardShell } from "@/components/genui/card-shell"

export function ChartCard({ data }: { data: ChartCardData }) {
  const chartData = data.labels.map((label, index) => {
    const row: Record<string, string | number> = { label }
    for (const series of data.series) {
      row[series.name] = series.values[index] ?? 0
    }
    return row
  })

  return (
    <CardShell type="chart" title={getCardTitle("chart", data.title)}>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {data.chartType === "bar" ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              {data.series.length > 1 ? <Legend /> : null}
              {data.series.map((series, index) => (
                <Bar
                  key={series.name}
                  dataKey={series.name}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </BarChart>
          ) : data.chartType === "line" ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              {data.series.length > 1 ? <Legend /> : null}
              {data.series.map((series, index) => (
                <Line
                  key={series.name}
                  type="monotone"
                  dataKey={series.name}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          ) : (
            <PieChart>
              <Tooltip />
              {data.series.length > 1 ? <Legend /> : null}
              <Pie
                data={data.labels.map((label, index) => ({
                  name: label,
                  value: data.series[0]?.values[index] ?? 0,
                }))}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
              >
                {data.labels.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </CardShell>
  )
}
