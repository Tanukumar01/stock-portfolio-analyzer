const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = null;
    this.range = null;
  }

  async initialize() {
    try {
      // Load environment variables
      require('dotenv').config();
      
      this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
      this.range = process.env.GOOGLE_SHEET_RANGE || 'A1:H1000';
      
      if (!this.spreadsheetId) {
        throw new Error('GOOGLE_SHEET_ID not found in environment variables');
      }

      const credentialsPath = path.join(__dirname, '..', process.env.GOOGLE_SHEETS_CREDENTIALS_FILE);
      
      if (!fs.existsSync(credentialsPath)) {
        throw new Error(`Google Sheets credentials file not found at: ${credentialsPath}`);
      }

      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      console.log('✅ Google Sheets service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Google Sheets service:', error.message);
      throw error;
    }
  }



  async fetchPortfolioData() {
    try {
      if (!this.sheets) {
        await this.initialize();
      }

      // Fetch user info (row 3)
      const userResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'F3:G3',
      });

      // Fetch stock data (rows 5-9)
      const stockResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'E5:L9',
      });

      const userRows = userResponse.data.values;
      const stockRows = stockResponse.data.values;
      
      if (!userRows || !stockRows || stockRows.length === 0) {
        throw new Error('No data found in the specified range');
      }

      // Extract user info
      const userName = userRows[0] ? userRows[0][0] : '';
      const userEmail = userRows[0] ? userRows[0][1] : '';

      // Extract stock headers (row 4)
      const headerResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'E4:L4',
      });
      const headers = headerResponse.data.values[0];
      
      // Map headers to expected fields
      const headerMap = {
        'Stock Name': 'stockName',
        'Ticker': 'ticker',
        'Quantity': 'quantity',
        'Current Price': 'currentPrice',
        'Sector': 'sector',
        'Total Investment': 'totalInvestment',
        'Current Value': 'currentValue',
        'Last 10 day Average price': 'averagePrice10Days'
      };

      // Convert data rows to objects
      const portfolioData = stockRows.slice(1).map((row, index) => {
        const stock = {};
        
        headers.forEach((header, colIndex) => {
          const fieldName = headerMap[header] || header.toLowerCase().replace(/\s+/g, '');
          let value = row[colIndex] || '';
          
          // Convert numeric fields
          if (['quantity', 'currentPrice', 'totalInvestment', 'currentValue', 'averagePrice10Days'].includes(fieldName)) {
            // Remove currency symbols and commas
            if (typeof value === 'string') {
              value = value.replace(/[₹,]/g, '');
            }
            value = parseFloat(value) || 0;
          }
          
          stock[fieldName] = value;
        });

        // Add user info to each stock
        stock.userName = userName;
        stock.userEmail = userEmail;
        
        return stock;
      }).filter(stock => stock.ticker && stock.ticker.trim() !== ''); // Filter out empty rows

      console.log(`📊 Fetched ${portfolioData.length} stocks from Google Sheets`);
      return portfolioData;

    } catch (error) {
      console.error('❌ Error fetching portfolio data from Google Sheets:', error.message);
      throw new Error(`Failed to fetch portfolio data: ${error.message}`);
    }
  }

  async updatePortfolioData(updatedData) {
    try {
      if (!this.sheets) {
        await this.initialize();
      }

      // Convert updated data back to rows format
      const headers = ['User Name', 'Email', 'Stock Name', 'Ticker', 'Quantity', 'Current Price', 'Sector', 'Total Investment'];
      
      const rows = updatedData.map(stock => [
        stock.userName || '',
        stock.email || '',
        stock.stockName || '',
        stock.ticker || '',
        stock.quantity || 0,
        stock.currentPrice || 0,
        stock.sector || '',
        stock.totalInvestment || 0
      ]);

      // Update the sheet
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: this.range,
        valueInputOption: 'RAW',
        resource: {
          values: [headers, ...rows]
        }
      });

      console.log('✅ Portfolio data updated in Google Sheets');
      return true;

    } catch (error) {
      console.error('❌ Error updating portfolio data in Google Sheets:', error.message);
      throw new Error(`Failed to update portfolio data: ${error.message}`);
    }
  }
}

module.exports = new GoogleSheetsService(); 