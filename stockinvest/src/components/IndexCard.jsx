import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

const IndexCard = ({ data }) => {
  const [pulseClass, setPulseClass] = useState('');
  const prevValueRef = useRef(data.value);

  const isUp = data.change >= 0;
  const strokeColor = isUp ? '#10b981' : '#ef4444'; // var(--accent-up) or var(--accent-down)
  const fillColor = isUp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';

  // Trigger pulse animation when data value changes
  useEffect(() => {
    if (data.value !== prevValueRef.current) {
      // Determine if the new change is up or down compared to the very previous tick
      const changedUp = data.value > prevValueRef.current;
      setPulseClass(changedUp ? 'animate-pulse-up' : 'animate-pulse-down');
      
      const timer = setTimeout(() => {
        setPulseClass('');
      }, 1000);
      
      prevValueRef.current = data.value;
      return () => clearTimeout(timer);
    }
  }, [data.value]);

  // Compute domain for chart to make it look dynamic but not too jittery
  const values = data.history.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.1;

  return (
    <div className={`index-card ${pulseClass}`}>
      <div className="index-header">
        <div>
          <div className="index-name">{data.name}</div>
          <div className="index-value">
            {data.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`index-change ${isUp ? 'change-up' : 'change-down'}`}>
            {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>
              {isUp ? '+' : ''}{data.change.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span>
              ({isUp ? '+' : ''}{data.percent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.history} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`colorValue-${data.name}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <YAxis 
              domain={[min - padding, max + padding]} 
              hide={true} 
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={strokeColor} 
              strokeWidth={2}
              fillOpacity={1} 
              fill={`url(#colorValue-${data.name})`}
              isAnimationActive={true}
              animationDuration={500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default IndexCard;
