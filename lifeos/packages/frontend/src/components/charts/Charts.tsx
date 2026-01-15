'use client';

import { useEffect, useState } from 'react';
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

const COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4',
  '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#0ea5e9', '#a855f7'
];

// Hook to detect dark mode
function useIsDarkMode() {
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Watch for class changes on html element
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);
  
  return isDark;
}

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
  maxItems?: number;
}

// Truncate text helper
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export function ProgressBarChart({
  data,
  dataKey = 'value',
  xAxisKey = 'name',
  height = 300,
  color = '#6366f1',
  maxItems = 6,
}: BarChartProps) {
  const isDark = useIsDarkMode();
  
  // Theme-aware colors
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const tickColor = isDark ? '#9ca3af' : '#6b7280';
  const bgColor = isDark ? '#374151' : '#e5e7eb';
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';
  const tooltipText = isDark ? '#f3f4f6' : '#1f2937';

  // Limit items and sort by value descending
  const chartData = [...data]
    .sort((a, b) => b.value - a.value)
    .slice(0, maxItems)
    .map(item => ({
      ...item,
      shortName: truncateText(item.name, 15),
    }));

  const dynamicHeight = Math.max(200, chartData.length * 45);

  return (
    <ResponsiveContainer width="100%" height={dynamicHeight}>
      <BarChart 
        data={chartData} 
        layout="vertical" 
        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={gridColor} />
        <XAxis 
          type="number" 
          domain={[0, 100]} 
          tickFormatter={(v) => `${v}%`}
          tick={{ fill: tickColor, fontSize: 12 }}
          axisLine={{ stroke: gridColor }}
        />
        <YAxis 
          dataKey="shortName" 
          type="category" 
          width={120}
          tick={{ fill: tickColor, fontSize: 11 }}
          axisLine={{ stroke: gridColor }}
        />
        <Tooltip 
          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Progress']}
          labelFormatter={(label) => {
            const item = chartData.find(d => d.shortName === label);
            return item?.name || label;
          }}
          contentStyle={{ 
            backgroundColor: tooltipBg, 
            border: `1px solid ${tooltipBorder}`,
            borderRadius: '8px',
          }}
          labelStyle={{ color: tooltipText }}
          itemStyle={{ color: tooltipText }}
          cursor={{ fill: 'transparent' }}
        />
        <Bar 
          dataKey={dataKey} 
          fill={color} 
          radius={[0, 4, 4, 0]}
          background={{ fill: bgColor }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface DonutChartProps {
  data: ChartData[];
  height?: number;
  maxItems?: number;
}

export function DonutChart({ data, height = 280, maxItems = 6 }: DonutChartProps) {
  const isDark = useIsDarkMode();
  
  // Theme-aware colors
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';
  const tooltipText = isDark ? '#f3f4f6' : '#1f2937';
  const centerBg = isDark ? 'bg-gray-900' : 'bg-white';
  const centerText = isDark ? 'text-white' : 'text-gray-900';
  const labelColor = isDark ? 'text-gray-300' : 'text-gray-700';
  const subLabelColor = isDark ? 'text-gray-500' : 'text-gray-500';
  const legendColor = isDark ? 'text-gray-400' : 'text-gray-600';

  // Filter out zero values and limit items
  const filteredData = data
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  // If only one item has value, show a simple display instead of pie chart
  if (filteredData.length === 1) {
    const item = filteredData[0];
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <div className={`w-20 h-20 rounded-full ${centerBg} flex items-center justify-center`}>
              <span className={`text-2xl font-bold ${centerText}`}>100%</span>
            </div>
          </div>
        </div>
        <p className={`mt-4 text-sm font-medium ${labelColor}`}>{item.name}</p>
        <p className={`text-xs ${subLabelColor} mt-1`}>{item.value.toLocaleString()}</p>
        <p className={`text-xs ${subLabelColor} mt-3`}>
          Add savings to other goals to see distribution
        </p>
      </div>
    );
  }

  // Group smaller items into "Others" if too many
  let chartData: ChartData[];
  if (filteredData.length > maxItems) {
    const topItems = filteredData.slice(0, maxItems - 1);
    const othersValue = filteredData.slice(maxItems - 1).reduce((sum, d) => sum + d.value, 0);
    chartData = [...topItems, { name: 'Others', value: othersValue }];
  } else {
    chartData = filteredData;
  }

  const paddingAngle = chartData.length > 1 ? 2 : 0;
  
  // Custom label that only shows percentage
  const renderCustomLabel = ({ percent }: { percent: number }) => {
    if (percent < 0.05) return null; // Don't show labels for slices < 5%
    return `${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            startAngle={90}
            endAngle={-270}
            innerRadius={55}
            outerRadius={85}
            paddingAngle={paddingAngle}
            dataKey="value"
            label={renderCustomLabel}
            labelLine={false}
            stroke="none"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string) => [
              value.toLocaleString(),
              name
            ]}
            contentStyle={{ 
              backgroundColor: tooltipBg, 
              border: `1px solid ${tooltipBorder}`,
              borderRadius: '8px',
            }}
            labelStyle={{ color: tooltipText }}
            itemStyle={{ color: tooltipText }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Custom Legend - Grid layout */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 px-4 w-full max-w-sm">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2 min-w-0">
            <div 
              className="w-3 h-3 rounded-sm flex-shrink-0" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className={`text-xs ${legendColor} truncate`} title={item.name}>
              {truncateText(item.name, 16)}
            </span>
          </div>
        ))}
      </div>
    </div>
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
  const isDark = useIsDarkMode();
  
  // Theme-aware colors
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const tickColor = isDark ? '#9ca3af' : '#6b7280';
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';
  const tooltipText = isDark ? '#f3f4f6' : '#1f2937';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey={xAxisKey} tick={{ fill: tickColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} />
        <YAxis tick={{ fill: tickColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: tooltipBg, 
            border: `1px solid ${tooltipBorder}`,
            borderRadius: '8px',
          }}
          labelStyle={{ color: tooltipText }}
          itemStyle={{ color: tooltipText }}
        />
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
