/* eslint-disable react/prop-types */
import { TrendingUp } from 'lucide-react';
import { Pie, PieChart } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer } from './ui/chart';

const chartData = [
  { browser: 'chrome', visitors: 275, fill: '#FF6384' },
  { browser: 'safari', visitors: 200, fill: '#36A2EB' },
  { browser: 'firefox', visitors: 187, fill: '#FFCE56' },
  { browser: 'edge', visitors: 173, fill: '#4BC0C0' },
  { browser: 'other', visitors: 90, fill: '#9966FF' },
];

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'hsl(var(--chart-1))',
  },
};

export default function Piechart({ title }) {
  return (
    <Card className="flex flex-col h-[400px]">
      {/* Card Header */}
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>

      {/* Card Content */}
      <CardContent className="flex-1 pb-0">
        {/* Wrapping the chart in ResponsiveContainer */}
        <div className="mx-auto max-w-xs">
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="visitors"
                nameKey="browser"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                fill="#8884d8"
                label={({ name, value }) => `${name}: ${value}`}
              />
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>

      {/* Card Footer */}
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}
