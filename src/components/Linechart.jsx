import { TrendingUp } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

// Chart Configuration
const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'hsl(var(--chart-1))',
  },
};

// Sample Data
const chartData = [
  { month: 'January', desktop: 186 },
  { month: 'February', desktop: 305 },
  { month: 'March', desktop: 237 },
  { month: 'April', desktop: 73 },
  { month: 'May', desktop: 209 },
  { month: 'June', desktop: 214 },
];

export function Linechart() {
  return (
    <Card className="shadow-lg rounded-lg bg-white dark:bg-gray-800 h-[400px]">
      {/* Header Section */}
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Line Chart
        </CardTitle>
        <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
          January - June 2024
        </CardDescription>
      </CardHeader>

      {/* Chart Section */}
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
            className="overflow-hidden"
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="hsl(var(--gray-200))"
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
              className="text-sm text-gray-600 dark:text-gray-300"
            />
            <ChartTooltip
              cursor={{ stroke: 'hsl(var(--chart-1))', strokeWidth: 2 }}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="desktop"
              type="monotone"
              stroke="hsl(var(--chart-1))"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>

      {/* Footer Section */}
      <CardFooter className="flex flex-col items-start gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium text-green-600 dark:text-green-400">
          Trending up by 5.2% this month
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-gray-500 dark:text-gray-400">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}
