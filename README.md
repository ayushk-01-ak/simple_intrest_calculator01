# Simple Interest Calculator

A modern, responsive Simple Interest Calculator with Express.js backend and beautiful UI. Features server-side calculations and INR currency formatting.

## Features

- 🧮 **Server-side Calculations** - All calculations performed on Express.js backend
- 💰 **INR Currency Support** - Displays amounts in Indian Rupees with proper formatting
- 📱 **Responsive Design** - Works perfectly on desktop and mobile devices
- 🎨 **Modern UI** - Beautiful dark theme with Tailwind CSS
- 📊 **Visual Sparklines** - Interactive growth visualization
- 📝 **Calculation History** - Stores recent calculations locally
- 📤 **Export Results** - Download results as PNG image
- 🔗 **Share Results** - Share calculations via Web Share API

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Icons**: Material Symbols
- **Export**: html2canvas

## Prerequisites

- Node.js 14.0.0 or higher
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd simple-calculator
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Development Mode
```bash
npm start
```

The application will be available at `http://localhost:3000`

### Production Deployment

#### Option 1: Direct Node.js Deployment
```bash
npm install --production
npm start
```

#### Option 2: Using PM2 (Recommended for production)
```bash
npm install -g pm2
pm2 start server.js --name "simple-calculator"
pm2 startup
pm2 save
```

#### Option 3: Docker Deployment
Create a `Dockerfile`:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t simple-calculator .
docker run -p 3000:3000 simple-calculator
```

## API Endpoints

### POST /calculate
Calculates simple interest based on provided parameters.

**Request Body:**
```json
{
  "P": 10000,
  "R": 5.5,
  "T": 2
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "principal": 10000,
    "rate": 5.5,
    "time": 2,
    "simpleInterest": 1100,
    "totalAmount": 11100
  }
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)

## Project Structure

```
simple-calculator/
├── index.html          # Main HTML file
├── script.js           # Frontend JavaScript
├── server.js           # Express.js server
├── style.css           # Custom styles
├── package.json        # Dependencies and scripts
├── .gitignore          # Git ignore file
└── README.md           # This file
```

## Deployment Platforms

### Heroku
1. Create a `Procfile`:
```
web: npm start
```

2. Deploy:
```bash
heroku create your-app-name
git push heroku main
```

### Vercel
1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

### Railway
1. Connect your GitHub repository
2. Railway will automatically detect and deploy the Node.js application

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues and questions, please open an issue on the GitHub repository.
