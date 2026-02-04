# 🦈 CardShark

> A modern, Instagram-inspired web application for tracking your sports card collection with AI-powered card recognition.

![CardShark Preview](./docs/preview.png)

## Features

- 📸 **AI-Powered Card Recognition** - Upload a photo and CardShark automatically identifies the card
- 🖼️ **Instagram-Style Gallery** - Beautiful grid layout with modal card view
- 🔍 **Smart Filtering** - Filter by sport, year, team, grade, value, and favorites
- 📊 **Portfolio Analytics** - Track your collection value over time
- 💰 **Price Alerts** - Get notified when card values change
- ❤️ **Favorites** - Mark your favorite cards with the heart button
- ⭐ **Wishlist** - Track cards you want to add (upload via Wishlist tab)
- 📱 **Mobile-First** - Designed for phone camera uploads

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + TypeScript + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Card OCR | Google Cloud Vision API |
| Card Search | eBay Browse API |
| Image Storage | Railway Volume |
| Hosting | Railway.com |

## Getting Started

### Prerequisites

- Node.js 20+ or 22+
- PostgreSQL database
- Google Cloud account (for Vision API)
- eBay Developer account (for Browse API)

### Environment Setup

1. Clone the repository:
   ```bash
   git clone git@github.com:michael-fp/card-shark.git
   cd card-shark
   ```

2. Install dependencies:
   ```bash
   # Server
   cd server && npm install
   
   # Client
   cd ../client && npm install
   ```

3. Configure environment variables:
   ```bash
   # Server
   cp server/.env.example server/.env
   # Edit server/.env with your credentials
   
   # Client
   cp client/.env.example client/.env
   # Edit client/.env with your credentials
   ```

4. Run database migrations:
   ```bash
   cd server && npm run migrate
   ```

5. Start development servers:
   ```bash
   # Terminal 1: Server
   cd server && npm run dev
   
   # Terminal 2: Client
   cd client && npm run dev
   ```

6. Open http://localhost:5173 in your browser

### API Keys Setup

#### Google Cloud Vision
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable the Cloud Vision API
4. Create an API key
5. Add to `server/.env` as `GOOGLE_CLOUD_API_KEY`

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services > Credentials
3. Create an OAuth 2.0 Client ID
4. Add authorized origins (localhost for dev, your domain for prod)
5. Add to both `.env` files as `GOOGLE_CLIENT_ID`

#### eBay Browse API
1. Go to [eBay Developer Portal](https://developer.ebay.com)
2. Create an application
3. Get Client ID and Client Secret
4. Add to `server/.env`

## Cost Safeguards

CardShark is designed to stay within free tier limits:

| Service | Free Tier | Our Limit | Status |
|---------|-----------|-----------|--------|
| Google Vision | 1,000/month | 900/month | ✅ Enforced |
| Railway Storage | 1GB | 800MB warning | ✅ Monitored |
| eBay API | Unlimited | N/A | ✅ Free |

## Deployment

### Railway.com

1. Create a new project on Railway
2. Add PostgreSQL addon
3. Connect your GitHub repository
4. Configure environment variables
5. Deploy!

## License

Private - Personal Use Only

## Author

Built with ❤️ by the Woollands family
