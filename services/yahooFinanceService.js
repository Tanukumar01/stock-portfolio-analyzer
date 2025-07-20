const yahooFinance = require('yahoo-finance2').default;

async function getYahooPriceAndAverage(ticker) {
  let currentPrice = 0;
  let avg10 = 0;

  try {
    // Fetch quote summary (current price)
    const quote = await yahooFinance.quote(ticker);
    currentPrice = quote.regularMarketPrice || 0;

    // Fetch historical prices (last 10 closes)
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 20); // Get enough days to cover 10 closes (skip weekends)
    const history = await yahooFinance.historical(ticker, {
      period1: past,
      period2: today,
      interval: '1d'
    });

    const closes = history
      .filter(day => day.close !== null && day.close !== undefined)
      .slice(-10)
      .map(day => day.close);

    if (closes.length > 0) {
      avg10 = closes.reduce((a, b) => a + b, 0) / closes.length;
    }
  } catch (err) {
    console.error(`❌ Error fetching Yahoo Finance data for ${ticker}:`, err.message);
  }

  return {
    currentPrice: parseFloat(currentPrice.toFixed(2)),
    avg10: parseFloat(avg10.toFixed(2))
  };
}

module.exports = { getYahooPriceAndAverage }; 