require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { getYahooPriceAndAverage } = require('./services/yahooFinanceService');

async function updateSheetPrices() {
  // Sheet config
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const credentialsPath = path.join(__dirname, process.env.GOOGLE_SHEETS_CREDENTIALS_FILE || 'credentials.json');
  const STOCK_HEADER_ROW = 4; // 1-indexed
  const STOCK_DATA_START_ROW = 5; // 1-indexed
  const STOCK_DATA_END_ROW = 9; // 1-indexed (inclusive)
  const TICKER_COL = 6; // F
  const CURRENT_PRICE_COL = 8; // H
  const AVG10_COL = 12; // L

  // Auth
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // Fetch tickers
  const range = `E${STOCK_DATA_START_ROW}:L${STOCK_DATA_END_ROW}`;
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    console.error('No stock data found in the specified range.');
    return;
  }

  // Prepare updates
  const updates = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const ticker = row[TICKER_COL - 5]; // F is 6th col, E is 5th, so index = col-5
    if (!ticker) continue;
    console.log(`Fetching Yahoo Finance data for: ${ticker}`);
    try {
      const { currentPrice, avg10 } = await getYahooPriceAndAverage(ticker);
      const quantity = parseFloat(row[2]); // Quantity is the 3rd column in E:L range
      const currentValue = currentPrice * quantity;
      const sheetRow = STOCK_DATA_START_ROW + i;
      updates.push({
        range: `H${sheetRow}:H${sheetRow}`,
        values: [[currentPrice]]
      });
      updates.push({
        range: `K${sheetRow}:K${sheetRow}`,
        values: [[avg10]]
      });
      updates.push({
        range: `J${sheetRow}:J${sheetRow}`,
        values: [[currentValue]]
      });
      console.log(`  → Current Price: $${currentPrice}, 10-day Avg: $${avg10}, Current Value: $${currentValue}`);
    } catch (err) {
      console.error(`  Error fetching data for ${ticker}: ${err.message}`);
    }
  }

  // Batch update
  if (updates.length > 0) {
    const batch = {
      spreadsheetId,
      resource: {
        valueInputOption: 'USER_ENTERED',
        data: updates
      }
    };
    await sheets.spreadsheets.values.batchUpdate(batch);
    console.log('Google Sheet updated with latest prices!');
  } else {
    console.log('No updates to apply.');
  }
}

module.exports = { updateSheetPrices }; 