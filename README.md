# TradingView Watchlist Backend

A Node.js/Express backend service for managing TradingView watchlists with MongoDB persistence. This service provides APIs to save and fetch user watchlists for the TradingView extension.

## Features

- **Save Watchlists**: Store user watchlist data in MongoDB
- **Fetch Watchlists**: Retrieve saved watchlists for specific users
- **Health Check**: Verify MongoDB connection and service health
- **CORS Support**: Enable cross-origin requests for frontend integration
- **Connection Pooling**: Optimized MongoDB connection management
- **Automatic Credential Encoding**: Handles special characters in MongoDB passwords

## Prerequisites

- Node.js 20 or higher
- MongoDB Atlas cluster or local MongoDB instance
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd watchlist-backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory (see [Environment Variables](#environment-variables) section)

4. Start the server:

```bash
npm start
```

The server will run on the port specified in your `.env` file (default: 3000).

## Environment Variables

### Local Development

Create a `.env` file with the following variables:

```env
# MongoDB Credentials
MONGODB_USERNAME=your_mongodb_username
MONGODB_PASSWORD=your_mongodb_password
MONGODB_CLUSTER=your_cluster.mongodb.net

# Database Configuration
MONGODB_DATABASE=tradingview
MONGODB_COLLECTION=watchlists

# Server Configuration
PORT=3000
```

### Cloud Deployment

Set these environment variables in your cloud service (AWS Lambda, Heroku, Vercel, etc.):

```
MONGODB_USERNAME=<your_username>
MONGODB_PASSWORD=<your_password>
MONGODB_CLUSTER=<your_cluster_address>
MONGODB_DATABASE=tradingview
MONGODB_COLLECTION=watchlists
PORT=3000
```

**Note**: Special characters (like `@`, `:`, `/`) in passwords are automatically URL-encoded by the application. You can use your raw password without manual encoding.

## API Endpoints

### 1. Health Check

Check if the service and MongoDB connection are working.

**Endpoint**: `GET /healthCheck`

**Response**:

```json
{
  "success": true,
  "message": "MongoDB connection successful",
  "data": {
    "connected": true,
    "database": "tradingview",
    "collection": "watchlists"
  }
}
```

### 2. Save Watchlists

Save or update watchlists for a specific user.

**Endpoint**: `POST /saveWatchlists`

**Request Body**:

```json
{
  "userId": "user123",
  "watchlists": [
    {
      "name": "Tech Stocks",
      "symbols": ["AAPL", "MSFT", "GOOGL"]
    },
    {
      "name": "Cryptos",
      "symbols": ["BTCUSD", "ETHUSD"]
    }
  ]
}
```

**Response**:

```json
{
  "success": true,
  "message": "Watchlists saved successfully",
  "data": {
    "matched": 1,
    "modified": 1,
    "upserted": false
  }
}
```

**Error Response** (400):

```json
{
  "error": "Missing required fields: watchlists, userId"
}
```

### 3. Fetch Watchlists

Retrieve saved watchlists for a specific user.

**Endpoint**: `POST /fetchWatchlists`

**Request Body**:

```json
{
  "userId": "user123"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Watchlists fetched successfully",
  "data": {
    "watchlists": [
      {
        "name": "Tech Stocks",
        "symbols": ["AAPL", "MSFT", "GOOGL"]
      }
    ],
    "updatedAt": "2024-05-24T10:30:00.000Z"
  }
}
```

**No Data Response** (200):

```json
{
  "success": true,
  "message": "No backup found",
  "data": null
}
```

### 4. Root Endpoint

Get basic service information.

**Endpoint**: `GET /`

**Response**:

```json
{
  "success": true,
  "message": "TradingView Watchlist Backend is running"
}
```

## Architecture

### Database Schema

The MongoDB collection stores documents with the following structure:

```javascript
{
  "_id": "tv-watchlists-{userId}",
  "data": [/* watchlist data */],
  "userId": "user123",
  "updatedAt": ISODate("2024-05-24T10:30:00.000Z")
}
```

### Connection Management

- Uses MongoDB connection pooling (maxPoolSize: 10)
- Maintains a single persistent connection per server instance
- Automatic reconnection on failure
- 5-second server selection timeout
- 10-second connection timeout

## Password Encoding

Special characters in MongoDB passwords are automatically handled:

- `@` is encoded as `%40`
- `:` is encoded as `%3A`
- `/` is encoded as `%2F`
- Other special characters are also properly encoded

**Example**: If your password is `Pratik@2242`, you can set it directly in the `.env` file, and the application will automatically encode it for the connection string.

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200**: Success
- **400**: Bad request (missing fields, invalid data, database error)
- **500**: Server error (connection issues)

## Development

### Start Development Server

```bash
npm start
```

### Troubleshooting

1. **MongoDB Connection Error**: Verify your credentials and cluster address in `.env`
2. **Port Already in Use**: Change the `PORT` environment variable
3. **Missing Environment Variables**: Ensure all required variables are set in `.env`

## Deployment

### Prerequisites for Cloud Deployment

1. Set all environment variables in your cloud service:
   - MONGODB_USERNAME
   - MONGODB_PASSWORD
   - MONGODB_CLUSTER
   - MONGODB_DATABASE
   - MONGODB_COLLECTION
   - PORT (optional, defaults to 3000)

2. Ensure Node.js 20 is available

### Popular Platforms

- **AWS Lambda**: Set environment variables in Lambda configuration
- **Heroku**: Use `heroku config:set` or Heroku Dashboard
- **Vercel**: Add environment variables in project settings
- **Railway**: Configure via Railway dashboard
- **Azure App Service**: Set in Application settings

## Dependencies

- **express**: Web framework for Node.js
- **cors**: Middleware for handling CORS
- **mongodb**: Official MongoDB driver
- **dotenv**: Environment variable management

## License

ISC

## Support

For issues or questions, please create an issue in the repository.
