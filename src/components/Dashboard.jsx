import React, { useState, useEffect } from 'react';
import IndexCard from './IndexCard';
import { fetchStockData } from '../utils/api';

const INDEX_CONFIGS = [
  { name: 'KOSPI', ticker: '^KS11' },
  { name: 'KOSDAQ', ticker: '^KQ11' },
  { name: 'NASDAQ', ticker: '^IXIC' },
  { name: 'S&P 500', ticker: '^GSPC' }
];

const Dashboard = () => {
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const results = await Promise.all(
        INDEX_CONFIGS.map(async (config) => {
          // Fetch intraday data for the mini chart
          const { meta, ohlc } = await fetchStockData(config.ticker, '1d', '5m');
          
          const currentPrice = meta.regularMarketPrice;
          const previousClose = meta.previousClose || meta.chartPreviousClose;
          const change = currentPrice - previousClose;
          const percent = (change / previousClose) * 100;

          // history is used by IndexCard's Recharts AreaChart
          const history = ohlc.map(d => ({ time: d.x, value: d.y[3] }));

          return {
            name: config.name,
            value: currentPrice,
            change: change,
            percent: percent,
            history: history
          };
        })
      );
      setIndices(results);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // 실시간 연동 (30초마다 업데이트)
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">글로벌 증시 현황</h1>
      {loading && indices.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>데이터를 불러오는 중입니다...</div>
      ) : (
        <div className="dashboard-grid">
          {indices.map(indexData => (
            <IndexCard key={indexData.name} data={indexData} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
