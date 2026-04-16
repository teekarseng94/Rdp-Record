# Daily Finance Tracker

A comprehensive daily finance tracking application that allows users to manage sales, expenses, salaries, and rental collections with customizable templates.

## Features

### 📊 **Sales Tracking**
- **Cigarette Sales**: Track sales of different cigarette brands with default prices
- **Rental Collection**: Monitor rental income from various food stalls
- **Coffee Sales**: Additional sales tracking

### 💰 **Expense Management**
- **Custom Expenses**: Add unlimited custom expense categories
- **Bank Transfer Expenses**: Track expenses paid via bank transfer
- **Salary Management**: Manage multiple salary payments

### 🎯 **Template System**
- **Auto-save Templates**: Automatically save frequently used expense/salary names
- **Template Management**: Add, remove, and manage saved templates
- **Auto-complete**: Quick selection from saved templates

### 📈 **Real-time Calculations**
- Automatic total calculations for all categories
- Real-time sales summaries
- Cash flow tracking

### 💾 **Data Storage**
- **Local Storage**: Browser-based data persistence
- **Backend API**: Optional server-side data storage
- **Export/Import**: Data backup and restore capabilities

## Quick Start

### Option 1: Standalone HTML (No Backend)
1. Open `daily-finance-tracker.html` in your web browser
2. Start tracking your daily finances immediately
3. All data is saved locally in your browser

### Option 2: With Backend Server
1. Install Node.js (version 14 or higher)
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Open your browser and go to `http://localhost:3000`

## Usage Guide

### Adding Expenses
1. Click the **"+ Add Expense"** button in the Expenses section
2. Enter the expense name (e.g., "Rent", "Utilities", "Supplies")
3. Enter the amount
4. The expense name will be automatically saved as a template for future use

### Managing Templates
1. Click **"Manage Templates"** button
2. Add new templates manually or remove existing ones
3. Templates will appear as suggestions when typing in expense/salary fields

### Daily Data Entry
1. Select the date (defaults to today)
2. Fill in cigarette sales quantities
3. Enter rental collection days
4. Add expenses, bank transfers, and salaries as needed
5. Fill in cash received and digital payments
6. Click **"Calculate All"** to update totals
7. Click **"Save Data"** to store the day's information

## API Endpoints (Backend)

### Templates
- `GET /api/expenses` - Get all expense templates
- `POST /api/expenses` - Add new expense template
- `DELETE /api/expenses/:name` - Remove expense template
- `GET /api/salaries` - Get all salary templates
- `POST /api/salaries` - Add new salary template
- `DELETE /api/salaries/:name` - Remove salary template
- `GET /api/bank-expenses` - Get all bank expense templates
- `POST /api/bank-expenses` - Add new bank expense template
- `DELETE /api/bank-expenses/:name` - Remove bank expense template

### Daily Data
- `POST /api/daily-data` - Save daily finance data
- `GET /api/daily-data` - Get all daily data
- `GET /api/daily-data/:date` - Get data for specific date
- `GET /api/daily-data/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Get data for date range

## File Structure

```
daily-finance-tracker/
├── daily-finance-tracker.html    # Main application file
├── server.js                    # Backend API server
├── package.json                 # Node.js dependencies
├── README.md                    # This file
└── data/                        # Data storage directory (created automatically)
    ├── expenses.json            # Expense templates
    ├── salaries.json            # Salary templates
    ├── bank-expenses.json       # Bank expense templates
    └── daily-data.json          # Daily finance data
```

## Customization

### Adding New Cigarette Brands
Edit the cigarette sales section in `daily-finance-tracker.html`:
```html
<th>New Brand</th>
<td><input type="number" value="15.0" readonly></td>
<td><input type="number" class="cigarette-qty" data-price="15.0" placeholder="0"></td>
```

### Adding New Rental Items
Edit the rental collection section:
```html
<th>New Item</th>
<td><input type="number" value="50" readonly></td>
<td><input type="number" class="rental-days" data-price="50" placeholder="0"></td>
```

## Data Backup

### Local Storage Backup
1. Open browser Developer Tools (F12)
2. Go to Application/Storage tab
3. Find Local Storage for your domain
4. Copy the data for backup

### Server Data Backup
The server automatically saves all data in JSON files in the `data/` directory. Simply copy these files for backup.

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - feel free to modify and distribute as needed.

## Support

For issues or feature requests, please check the browser console for error messages and ensure all required fields are filled correctly.
