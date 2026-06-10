export const fetchStockData = async (ticker, range, interval) => {
  try {
    const response = await fetch(`/api/yahoo?ticker=${encodeURIComponent(ticker)}&range=${range}&interval=${interval}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch data for ${ticker}`);
    }
    const data = await response.json();
    
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error('No data found');
    }

    const result = data.chart.result[0];
    const meta = result.meta;
    const timestamps = result.timestamp;
    
    if (!timestamps) {
      throw new Error('No timestamp data found');
    }

    const quote = result.indicators.quote[0];
    
    // Combine into OHLC format required by ApexCharts
    // { x: Date, y: [Open, High, Low, Close] }
    const ohlc = timestamps.map((timestamp, index) => {
      // Sometimes Yahoo API returns null for some candles
      const open = quote.open[index];
      const high = quote.high[index];
      const low = quote.low[index];
      const close = quote.close[index];
      
      return {
        x: timestamp * 1000, // milliseconds for ApexCharts
        y: [open, high, low, close]
      };
    }).filter(item => item.y[0] !== null && item.y[3] !== null);

    return { meta, ohlc };
  } catch (error) {
    console.error('Error fetching stock data:', error);
    throw error;
  }
};
