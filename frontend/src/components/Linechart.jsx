import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts';

export function Linechart({ data }) {
  const renderData = data && data.length > 0 ? data : [];

  return (
    <div className="bg-surface-container-low rounded-xl p-8 flex flex-col h-[400px] relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-lg font-bold font-headline">
            Cash Flow Analytics
          </h3>
          <p className="text-xs text-outline mt-1">
            Daily liquidity tracking (Last 30 days)
          </p>
        </div>
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-primary"></span>
            <span className="text-xs text-outline font-medium">Inflow</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-tertiary"></span>
            <span className="text-xs text-outline font-medium">Outflow</span>
          </div>
        </div>
      </div>
      <div className="flex-1 relative mt-4 border-l border-b border-white/5 flex items-end">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={renderData}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-color)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--accent-color)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#8e9196', fontSize: 10, fontWeight: 500 }}
              dy={15}
              tickFormatter={(val) => {
                if (!val) return '';
                const parts = val.split('-');
                if (parts.length === 3) return `${parts[2]} Sept`;
                return val;
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#283646',
                borderColor: 'transparent',
                color: 'var(--text-primary)',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ display: 'none' }}
              cursor={{ stroke: 'rgba(76, 214, 251, 0.4)', strokeWidth: 1 }}
              formatter={(value, name) => [
                `+$${Number(value).toLocaleString()}`,
                name,
              ]}
            />
            <Area
              type="monotone"
              dataKey="dailyIncome"
              name="Inflow"
              stroke="var(--accent-color)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorIn)"
            />
            <Area
              type="monotone"
              dataKey="dailyExpense"
              name="Outflow"
              stroke="#27e0a9"
              strokeWidth={2}
              fill="transparent"
              strokeDasharray="4 4"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
