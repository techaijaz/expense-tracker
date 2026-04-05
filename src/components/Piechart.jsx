import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['var(--accent-color)', '#27e0a9', '#bbc6e2', '#3e4960', 'var(--accent-color)'];

export default function Piechart({ title, data }) {
  const renderData = data && data.length > 0 ? data : [];

  return (
    <div className="bg-surface-container-low rounded-xl p-8 flex flex-col h-[400px]">
      <h3 className="text-lg font-bold font-headline mb-6">{title}</h3>
      <div className="flex-1 flex flex-col justify-center items-center space-y-8">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={renderData}
                cx="50%"
                cy="50%"
                innerRadius="80%"
                outerRadius="100%"
                paddingAngle={0}
                dataKey="value"
                stroke="#1e2b3b"
                strokeWidth={2}
              >
                {renderData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `$${Number(value).toLocaleString()}`}
                contentStyle={{
                  backgroundColor: '#283646',
                  borderColor: 'transparent',
                  color: 'var(--text-primary)',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute text-center mt-1">
            <div className="text-2xl font-bold font-headline tabular-nums">
              74%
            </div>
            <div className="text-[10px] text-outline font-bold uppercase tracking-tighter">
              Liquidity
            </div>
          </div>
        </div>
        <div className="w-full space-y-4 max-h-[140px] overflow-y-auto hide-scrollbar border-t border-transparent pt-2">
          {renderData.map((item, index) => (
            <div
              key={item.name}
              className="flex justify-between items-center p-3 bg-surface-container-lowest rounded-lg"
            >
              <div className="flex items-center">
                <div
                  className="w-2 h-2 rounded-full mr-3"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-xs font-semibold">{item.name}</span>
              </div>
              <span className="text-xs font-bold tabular-nums">
                $
                {Number(item.value).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
