# Travel with Buddy API Proxy Server

This is a simple Express server that proxies requests to the Mappls API to avoid CORS issues in the frontend.

## Setup Instructions

### Prerequisites
- Node.js (v12 or higher)
- npm (comes with Node.js)

### Installation Steps

1. Open PowerShell as Administrator and run the following command to allow script execution:
   ```
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```
   
   For development with auto-reload:
   ```
   npm run dev
   ```

4. The server will start on port 3001. You can access the Mappls token endpoint at:
   ```
   http://localhost:3001/api/mappls/token
   ```

## Integration with Frontend

Update your frontend code in `js/book-ride.js` to call this proxy server instead of directly calling the Mappls API.

Example:
```javascript
async function getMapplsAccessToken() {
  try {
    const response = await fetch('http://localhost:3001/api/mappls/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}
```

## Security Notes

For production deployment:
1. Store API credentials as environment variables
2. Set up proper CORS restrictions
3. Consider adding rate limiting and authentication for the proxy endpoint 