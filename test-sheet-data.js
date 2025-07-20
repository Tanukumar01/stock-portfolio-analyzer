const dotenv = require('dotenv');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

async function testSheetData() {
    console.log('Testing Google Sheet Data...\n');

    try {
        // Load credentials
        const credentialsPath = path.join(__dirname, 'credentials.json');
        const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
        
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        console.log(' Testing different ranges in your Google Sheet...\n');

        // Test different ranges to see what data exists
        const ranges = [
            'A1:Z10',    // First 10 rows, all columns
            'E1:L10',    // Columns E-L, first 10 rows
            'A1:A20',    // Column A, first 20 rows
            'E1:E20',    // Column E, first 20 rows
            'A1:Z5',     // First 5 rows, all columns
            'E3:G4',     // User info area
            'E5:L10'     // Stock data area
        ];

        for (const range of ranges) {
            try {
                console.log(` Testing range: ${range}`);
                const response = await sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range,
                });

                const values = response.data.values;
                if (values && values.length > 0) {
                    console.log(` Found ${values.length} rows in ${range}:`);
                    values.forEach((row, index) => {
                        console.log(`   Row ${index + 1}: [${row.join(', ')}]`);
                    });
                } else {
                    console.log(` No data found in ${range}`);
                }
                console.log('');
            } catch (error) {
                console.log(` Error reading ${range}: ${error.message}\n`);
            }
        }

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

// Run the test
testSheetData(); 