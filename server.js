const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/node_modules/pdfjs-dist', express.static(path.join(__dirname, 'node_modules', 'pdfjs-dist')));

// Data storage files
const DATA_DIR = './data';
const EXPENSES_FILE = path.join(DATA_DIR, 'expenses.json');
const SALARIES_FILE = path.join(DATA_DIR, 'salaries.json');
const BANK_EXPENSES_FILE = path.join(DATA_DIR, 'bank-expenses.json');
const DAILY_DATA_FILE = path.join(DATA_DIR, 'daily-data.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Initialize data files if they don't exist
const initializeFile = (filePath, defaultData = []) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    }
};

initializeFile(EXPENSES_FILE);
initializeFile(SALARIES_FILE);
initializeFile(BANK_EXPENSES_FILE);
initializeFile(DAILY_DATA_FILE);

// Helper function to read JSON file
const readJsonFile = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
};

// Helper function to write JSON file
const writeJsonFile = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
};

// Routes

// Get all expense templates
app.get('/api/expenses', (req, res) => {
    const expenses = readJsonFile(EXPENSES_FILE);
    res.json(expenses);
});

// Add new expense template
app.post('/api/expenses', (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Expense name is required' });
    }

    const expenses = readJsonFile(EXPENSES_FILE);
    
    // Check if expense already exists
    if (expenses.includes(name.trim())) {
        return res.status(409).json({ error: 'Expense already exists' });
    }

    expenses.push(name.trim());
    
    if (writeJsonFile(EXPENSES_FILE, expenses)) {
        res.json({ message: 'Expense added successfully', expenses });
    } else {
        res.status(500).json({ error: 'Failed to save expense' });
    }
});

// Remove expense template
app.delete('/api/expenses/:name', (req, res) => {
    const { name } = req.params;
    const expenses = readJsonFile(EXPENSES_FILE);
    
    const index = expenses.indexOf(name);
    if (index === -1) {
        return res.status(404).json({ error: 'Expense not found' });
    }

    expenses.splice(index, 1);
    
    if (writeJsonFile(EXPENSES_FILE, expenses)) {
        res.json({ message: 'Expense removed successfully', expenses });
    } else {
        res.status(500).json({ error: 'Failed to remove expense' });
    }
});

// Get all salary templates
app.get('/api/salaries', (req, res) => {
    const salaries = readJsonFile(SALARIES_FILE);
    res.json(salaries);
});

// Add new salary template
app.post('/api/salaries', (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Salary name is required' });
    }

    const salaries = readJsonFile(SALARIES_FILE);
    
    // Check if salary already exists
    if (salaries.includes(name.trim())) {
        return res.status(409).json({ error: 'Salary already exists' });
    }

    salaries.push(name.trim());
    
    if (writeJsonFile(SALARIES_FILE, salaries)) {
        res.json({ message: 'Salary added successfully', salaries });
    } else {
        res.status(500).json({ error: 'Failed to save salary' });
    }
});

// Remove salary template
app.delete('/api/salaries/:name', (req, res) => {
    const { name } = req.params;
    const salaries = readJsonFile(SALARIES_FILE);
    
    const index = salaries.indexOf(name);
    if (index === -1) {
        return res.status(404).json({ error: 'Salary not found' });
    }

    salaries.splice(index, 1);
    
    if (writeJsonFile(SALARIES_FILE, salaries)) {
        res.json({ message: 'Salary removed successfully', salaries });
    } else {
        res.status(500).json({ error: 'Failed to remove salary' });
    }
});

// Get all bank expense templates
app.get('/api/bank-expenses', (req, res) => {
    const bankExpenses = readJsonFile(BANK_EXPENSES_FILE);
    res.json(bankExpenses);
});

// Add new bank expense template
app.post('/api/bank-expenses', (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Bank expense name is required' });
    }

    const bankExpenses = readJsonFile(BANK_EXPENSES_FILE);
    
    // Check if bank expense already exists
    if (bankExpenses.includes(name.trim())) {
        return res.status(409).json({ error: 'Bank expense already exists' });
    }

    bankExpenses.push(name.trim());
    
    if (writeJsonFile(BANK_EXPENSES_FILE, bankExpenses)) {
        res.json({ message: 'Bank expense added successfully', bankExpenses });
    } else {
        res.status(500).json({ error: 'Failed to save bank expense' });
    }
});

// Remove bank expense template
app.delete('/api/bank-expenses/:name', (req, res) => {
    const { name } = req.params;
    const bankExpenses = readJsonFile(BANK_EXPENSES_FILE);
    
    const index = bankExpenses.indexOf(name);
    if (index === -1) {
        return res.status(404).json({ error: 'Bank expense not found' });
    }

    bankExpenses.splice(index, 1);
    
    if (writeJsonFile(BANK_EXPENSES_FILE, bankExpenses)) {
        res.json({ message: 'Bank expense removed successfully', bankExpenses });
    } else {
        res.status(500).json({ error: 'Failed to remove bank expense' });
    }
});

// Save daily finance data
app.post('/api/daily-data', (req, res) => {
    const dailyData = req.body;
    
    if (!dailyData.date) {
        return res.status(400).json({ error: 'Date is required' });
    }

    const allData = readJsonFile(DAILY_DATA_FILE);
    
    // Add timestamp
    dailyData.timestamp = new Date().toISOString();
    
    allData.push(dailyData);
    
    if (writeJsonFile(DAILY_DATA_FILE, allData)) {
        res.json({ message: 'Daily data saved successfully', data: dailyData });
    } else {
        res.status(500).json({ error: 'Failed to save daily data' });
    }
});

// Get all daily data
app.get('/api/daily-data', (req, res) => {
    const allData = readJsonFile(DAILY_DATA_FILE);
    res.json(allData);
});

// Get daily data by date range
app.get('/api/daily-data/range', (req, res) => {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const allData = readJsonFile(DAILY_DATA_FILE);
    const filteredData = allData.filter(entry => {
        const entryDate = new Date(entry.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return entryDate >= start && entryDate <= end;
    });

    res.json(filteredData);
});

// Get daily data by specific date
app.get('/api/daily-data/:date', (req, res) => {
    const { date } = req.params;
    const allData = readJsonFile(DAILY_DATA_FILE);
    
    const dayData = allData.filter(entry => entry.date === date);
    
    if (dayData.length === 0) {
        return res.status(404).json({ error: 'No data found for this date' });
    }

    res.json(dayData);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'daily-finance-tracker.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Daily Finance Tracker API server running on port ${PORT}`);
    console.log(`📊 Access the app at: http://localhost:${PORT}`);
    console.log(`🔗 API endpoints available at: http://localhost:${PORT}/api/`);
});

module.exports = app;
