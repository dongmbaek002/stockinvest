import React, { useState, useEffect, useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { fetchStockData } from '../utils/api';
import { Search, BarChart2, TrendingUp } from 'lucide-react';

const rangeConfig = {
  '5Y': { apiRange: '5y', interval: '1d' },
  '3Y': { apiRange: '5y', interval: '1d' }, // Will filter 3Y from 5Y data
  '1Y': { apiRange: '1y', interval: '1d' },
  '6M': { apiRange: '6mo', interval: '1d' },
  '1M': { apiRange: '1mo', interval: '1d' },
  '1W': { apiRange: '5d', interval: '15m' },
  '1D': { apiRange: '1d', interval: '2m' },
  '1H': { apiRange: '1d', interval: '1m' }, // Will filter 1H from 1D data
};

const DOMESTIC_STOCKS = [
  { name: 'KODEX 미국나스닥100', ticker: '133690.KS' },
  { name: '일진전기', ticker: '103590.KS' },
  { name: '대우건설', ticker: '047040.KS' },
  { name: '대한전선', ticker: '001440.KS' },
  // LG씨엔에스는 비상장으로 Yahoo Finance 연동이 안 될 수 있으나 목록에 포함
  { name: 'LG씨엔에스', ticker: 'LGCNS.OTC' }, 
  { name: '두산로보틱스', ticker: '454910.KS' },
  { name: '두산에너빌리티', ticker: '034020.KS' },
  { name: '삼성물산', ticker: '028260.KS' },
  { name: '삼성중공업', ticker: '010140.KS' },
  { name: 'LS ELECTRIC', ticker: '010120.KS' },
  { name: '대한항공', ticker: '003490.KS' },
  { name: '한국전력', ticker: '015760.KS' },
];

const StockDetail = () => {
  const [tickerInput, setTickerInput] = useState('');
  const [activeTicker, setActiveTicker] = useState('AAPL');
  const [activeName, setActiveName] = useState('AAPL'); // 화면 표시용 이름
  const [activeRange, setActiveRange] = useState('5Y');
  const [chartType, setChartType] = useState('candlestick');
  
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async (ticker, rangeKey) => {
    setLoading(true);
    setError(null);
    try {
      const config = rangeConfig[rangeKey];
      const { meta, ohlc } = await fetchStockData(ticker, config.apiRange, config.interval);
      
      let filteredData = ohlc;
      const now = new Date().getTime();
      
      if (rangeKey === '3Y') {
        const threeYearsAgo = new Date();
        threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
        filteredData = ohlc.filter(d => d.x >= threeYearsAgo.getTime());
      } else if (rangeKey === '1H') {
        if (ohlc.length > 0) {
            const lastTimestamp = ohlc[ohlc.length - 1].x;
            const oneHourAgo = lastTimestamp - (60 * 60 * 1000);
            filteredData = ohlc.filter(d => d.x >= oneHourAgo);
        }
      }
      
      setChartData(filteredData);
    } catch (err) {
      setError(err.message || '데이터를 불러오는데 실패했습니다.');
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeTicker, activeRange);
  }, [activeTicker, activeRange]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (tickerInput.trim()) {
      const input = tickerInput.trim();
      
      // 국내 종목 한글 검색 처리
      const matchedStock = DOMESTIC_STOCKS.find(s => s.name.includes(input));
      if (matchedStock) {
        setActiveTicker(matchedStock.ticker);
        setActiveName(matchedStock.name);
      } 
      // 숫자만 6자리 입력 시 한국 주식으로 간주 (.KS 자동 붙임)
      else if (/^[0-9]{6}$/.test(input)) {
        setActiveTicker(input + '.KS');
        setActiveName(input);
      } 
      else {
        setActiveTicker(input.toUpperCase());
        setActiveName(input.toUpperCase());
      }
    }
  };

  const handleSelectStock = (stock) => {
    setActiveTicker(stock.ticker);
    setActiveName(stock.name);
    setTickerInput('');
  };

  const seriesData = useMemo(() => {
    if (chartType === 'candlestick') {
      return [{
        name: activeName,
        data: chartData
      }];
    } else {
      return [{
        name: activeName,
        // Map OHLC to just Close price for line chart
        data: chartData.map(d => ({ x: d.x, y: d.y[3] }))
      }];
    }
  }, [chartData, chartType, activeName]);

  const options = {
    chart: {
      type: chartType,
      height: 400,
      background: 'transparent',
      toolbar: { show: false },
      animations: { enabled: false },
    },
    theme: { mode: 'dark' },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: false,
        style: { colors: '#94a3b8' }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      tooltip: { enabled: true },
      labels: {
        style: { colors: '#94a3b8' },
        formatter: (value) => value.toFixed(2)
      }
    },
    grid: {
      borderColor: '#334155',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: 'dark',
      x: { format: 'dd MMM yyyy HH:mm' }
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#10b981',
          downward: '#ef4444'
        },
        wick: { useFillColor: true }
      }
    },
    stroke: {
      curve: 'straight',
      width: chartType === 'line' ? 2 : 1,
      colors: chartType === 'line' ? ['#3b82f6'] : undefined
    }
  };

  return (
    <div className="stock-detail-container">
      <div className="stock-detail-header">
        <form onSubmit={handleSearch} className="search-form">
          <input 
            type="text" 
            placeholder="티커 검색 (예: AAPL, MSFT)" 
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            <Search size={18} />
          </button>
        </form>
        
        <div className="chart-controls">
          <div className="chart-type-toggle">
            <button 
              className={`toggle-btn ${chartType === 'candlestick' ? 'active' : ''}`}
              onClick={() => setChartType('candlestick')}
              title="캔들 차트"
            >
              <BarChart2 size={18} />
            </button>
            <button 
              className={`toggle-btn ${chartType === 'line' ? 'active' : ''}`}
              onClick={() => setChartType('line')}
              title="라인 차트"
            >
              <TrendingUp size={18} />
            </button>
          </div>
          
          <div className="range-selectors">
            {Object.keys(rangeConfig).map(range => (
              <button 
                key={range}
                className={`range-btn ${activeRange === range ? 'active' : ''}`}
                onClick={() => setActiveRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="domestic-watchlist">
        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>관심 종목 (빠른 선택)</h3>
        <div className="watchlist-chips">
          {DOMESTIC_STOCKS.map(stock => (
            <button 
              key={stock.ticker}
              className={`chip-btn ${activeTicker === stock.ticker ? 'active' : ''}`}
              onClick={() => handleSelectStock(stock)}
            >
              {stock.name}
            </button>
          ))}
        </div>
      </div>

      <div className="stock-detail-content">
        <h2 className="detail-title">{activeName} 상세 차트</h2>
        
        {loading ? (
          <div className="loading-state">데이터를 불러오는 중입니다...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : chartData.length > 0 ? (
          <div className="apex-chart-wrapper">
            <ReactApexChart 
              options={options} 
              series={seriesData} 
              type={chartType} 
              height={400} 
            />
          </div>
        ) : (
          <div className="empty-state">데이터가 없습니다.</div>
        )}
      </div>
    </div>
  );
};

export default StockDetail;
