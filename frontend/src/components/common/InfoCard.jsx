const InfoCard = ({
  accentColor = 'primary',
  icon,
  title,
  amount,
  trendText,
  trendUp,
}) => {
  return (
    <div className="bg-surface-container-low p-6 rounded-xl relative overflow-hidden group">
      <div
        className={`absolute left-0 top-0 bottom-0 w-[2px] bg-${accentColor}`}
      ></div>
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-outline">
          {title}
        </span>
        <span
          className={`material-symbols-outlined text-${accentColor} opacity-50`}
          style={{ fontVariationSettings: "'FILL' 0" }}
        >
          {icon}
        </span>
      </div>
      <div className="space-y-1">
        <div className="text-4xl font-extrabold font-headline tabular-nums">
          {amount}
        </div>
        <div
          className={`flex items-center text-${trendUp ? 'tertiary' : 'error'} text-xs font-bold`}
        >
          <span
            className="material-symbols-outlined text-xs mr-1"
            style={{ fontVariationSettings: "'wght' 700" }}
          >
            {trendUp ? 'trending_up' : 'trending_down'}
          </span>
          {trendText}
        </div>
      </div>
      <div
        className={`absolute -right-10 -bottom-10 w-32 h-32 bg-${accentColor}/5 rounded-full blur-3xl group-hover:bg-${accentColor}/10 transition-colors`}
      ></div>
    </div>
  );
};

export default InfoCard;
