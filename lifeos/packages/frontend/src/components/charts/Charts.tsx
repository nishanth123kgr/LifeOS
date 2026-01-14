'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface BarChartProps {
  data: ChartData[];
  dataKey?: string;
  xAxisKey?: string;
  height?: number;
  color?: string;
}

export function ProgressBarChart({
  data,
  dataKey = 'value',
  xAxisKey = 'name',
  height = 300,
  color = '#6366f1',
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <YAxis dataKey={xAxisKey} type="category" width={70} />
        <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
        <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface DonutChartProps {
  data: ChartData[];
  height?: number;
}

export function DonutChart({ data, height = 300 }: DonutChartProps) {
  // Only add padding angle when there are multiple items
  const paddingAngle = data.length > 1 ? 2 : 0;
  // Use smaller inner radius for single item to look more like a complete ring
  const innerRadius = data.length > 1 ? 60 : 70;
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          startAngle={90}
          endAngle={-270}
          innerRadius={innerRadius}
          outerRadius={100}
          paddingAngle={paddingAngle}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          stroke="none"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => value.toLocaleString()} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface LineChartProps {
  data: ChartData[];
  dataKeys: string[];
  xAxisKey?: string;
  height?: number;
}

export function TrendLineChart({
  data,
  dataKeys,
  xAxisKey = 'name',
  height = 300,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {dataKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={COLORS[index % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
