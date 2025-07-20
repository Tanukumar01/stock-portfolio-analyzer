const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Import your updateSheetPrices function
const { updateSheetPrices } = require('./server'); // Adjust if needed

app.get('/update-prices', async (req, res) => {
  try {
    await updateSheetPrices();
    res.status(200).send('Sheet prices updated!');
  } catch (err) {
    res.status(500).send('Error updating prices: ' + err.message);
  }
});

app.post('/update-prices', async (req, res) => {
  try {
    await updateSheetPrices();
    res.status(200).send('Sheet prices updated!');
  } catch (err) {
    res.status(500).send('Error updating prices: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { updateSheetPrices }; 