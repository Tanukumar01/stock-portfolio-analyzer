const dotenv = require('dotenv');
const googleSheetsService = require('./services/googleSheetsService');

// Load environment variables
dotenv.config();

async function testGoogleSheetsConnection() {
    console.log('🔍 Testing Google Sheets Connection...\n');

    try {
        // Test 1: Check if credentials file exists
        console.log('✅ Step 1: Checking credentials file...');
        const fs = require('fs');
        const credentialsPath = process.env.GOOGLE_SHEETS_CREDENTIALS_FILE || 'credentials.json';
        
        if (!fs.existsSync(credentialsPath)) {
            throw new Error(`Credentials file not found: ${credentialsPath}`);
        }
        console.log(`✅ Credentials file found: ${credentialsPath}`);

        // Test 2: Check environment variables
        console.log('\n✅ Step 2: Checking environment variables...');
        if (!process.env.GOOGLE_SHEET_ID) {
            throw new Error('GOOGLE_SHEET_ID not found in environment variables');
        }
        console.log(`✅ Google Sheet ID: ${process.env.GOOGLE_SHEET_ID}`);
        console.log(`✅ Sheet Range: ${process.env.GOOGLE_SHEET_RANGE || 'A1:H1000'}`);

        // Test 3: Try to fetch data from Google Sheets
        console.log('\n✅ Step 3: Testing data fetch from Google Sheets...');
        const portfolioData = await googleSheetsService.fetchPortfolioData();
        
        if (!portfolioData || portfolioData.length === 0) {
            throw new Error('No data found in Google Sheet');
        }

        console.log(`✅ Successfully fetched ${portfolioData.length} stocks from Google Sheets`);
        
        // Test 4: Validate data structure
        console.log('\n✅ Step 4: Validating data structure...');
        const requiredFields = ['userName', 'stockName', 'ticker', 'quantity', 'currentPrice', 'sector', 'totalInvestment'];
        
        portfolioData.forEach((stock, index) => {
            console.log(`\n📊 Stock ${index + 1}:`);
            console.log(`   Ticker: ${stock.ticker}`);
            console.log(`   Name: ${stock.stockName}`);
            console.log(`   Quantity: ${stock.quantity}`);
            console.log(`   Current Price: ₹${stock.currentPrice}`);
            console.log(`   Total Investment: ₹${stock.totalInvestment}`);
            console.log(`   Current Value: ₹${stock.currentValue}`);
            console.log(`   Sector: ${stock.sector}`);
            console.log(`   User: ${stock.userName} (${stock.userEmail})`);
            
            // Check for missing fields
            const missingFields = requiredFields.filter(field => !stock[field] && stock[field] !== 0);
            if (missingFields.length > 0) {
                console.warn(`   ⚠️ Missing fields: ${missingFields.join(', ')}`);
            }
        });

        // Test 5: Calculate totals
        console.log('\n✅ Step 5: Calculating portfolio totals...');
        const totalInvestment = portfolioData.reduce((sum, stock) => sum + (stock.totalInvestment || 0), 0);
        const totalQuantity = portfolioData.reduce((sum, stock) => sum + (stock.quantity || 0), 0);
        const uniqueTickers = [...new Set(portfolioData.map(stock => stock.ticker))];
        
        console.log(`   Total Investment: ₹${totalInvestment.toLocaleString()}`);
        console.log(`   Total Quantity: ${totalQuantity.toLocaleString()}`);
        console.log(`   Unique Stocks: ${uniqueTickers.length}`);
        console.log(`   Tickers: ${uniqueTickers.join(', ')}`);

        console.log('\n🎉 All tests passed! Your Google Sheets setup is working correctly.');
        console.log('\n📋 Next steps:');
        console.log('   1. Run the main application: npm run dev');
        console.log('   2. Open http://localhost:3000 in your browser');
        console.log('   3. Click "Load Portfolio" to see your data');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('   1. Check if credentials.json is in the project root');
        console.log('   2. Verify GOOGLE_SHEET_ID in your .env file');
        console.log('   3. Ensure your Google Sheet is shared with the service account');
        console.log('   4. Check if Google Sheets API is enabled in your Google Cloud project');
        console.log('   5. Verify your Google Sheet has data in the correct format');
    }
}

// Run the test
testGoogleSheetsConnection(); 