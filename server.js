const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));

// POST route for simple interest calculation
app.post('/calculate', (req, res) => {
  try {
    const { P, R, T } = req.body;
    
    // Validate input
    if (P === undefined || R === undefined || T === undefined) {
      return res.status(400).json({ 
        error: 'Missing required parameters: P (principal), R (rate), T (time)' 
      });
    }
    
    const principal = parseFloat(P);
    const rate = parseFloat(R);
    const time = parseFloat(T);
    
    // Check if values are valid numbers
    if (isNaN(principal) || isNaN(rate) || isNaN(time)) {
      return res.status(400).json({ 
        error: 'All parameters must be valid numbers' 
      });
    }
    
    // Check for negative values
    if (principal < 0 || rate < 0 || time < 0) {
      return res.status(400).json({ 
        error: 'All parameters must be non-negative' 
      });
    }
    
    // Simple Interest formula: SI = (P * R * T) / 100
    const simpleInterest = (principal * rate * time) / 100;
    const totalAmount = principal + simpleInterest;
    
    // Return the calculation results
    res.json({
      success: true,
      data: {
        principal: principal,
        rate: rate,
        time: time,
        simpleInterest: simpleInterest,
        totalAmount: totalAmount
      }
    });
    
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({ 
      error: 'Internal server error during calculation' 
    });
  }
});

// Root route - serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(` Simple Interest Calculator server running on port ${PORT}`);
  console.log(` Frontend: http://localhost:${PORT}`);
  console.log(` API: POST http://localhost:${PORT}/calculate`);
  console.log(` Health: GET http://localhost:${PORT}/health`);
});