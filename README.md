# MoMo Payments Backend API

A simple Node.js backend for MTN Mobile Money (MoMo) payments, designed to be deployed on Vercel and used with React Native web apps.

## Features

- Request payment from users
- Check payment status
- Get account balance
- Handle MoMo callbacks
- CORS enabled for frontend integration
- Environment-based configuration

## API Endpoints

### `GET /`
Health check endpoint

### `POST /api/request-payment`
Request a payment from a user

**Request Body:**
```json
{
  "amount": "100",
  "currency": "EUR",
  "externalId": "unique-transaction-id",
  "payer": {
    "partyId": "256774290781"
  },
  "payerMessage": "Payment for your order",
  "payeeNote": "Order #123"
}
```

**Response:**
```json
{
  "success": true,
  "referenceId": "uuid-reference-id",
  "message": "Payment request submitted successfully"
}
```

### `GET /api/payment-status/:referenceId`
Check the status of a payment

**Response:**
```json
{
  "success": true,
  "status": "SUCCESSFUL",
  "data": {
    "amount": "100",
    "currency": "EUR",
    "status": "SUCCESSFUL",
    "reason": null
  }
}
```

### `GET /api/account-balance`
Get account balance

**Response:**
```json
{
  "success": true,
  "balance": {
    "availableBalance": "1000",
    "currency": "EUR"
  }
}
```

### `POST /callback`
Webhook endpoint for MoMo payment notifications

## Setup Instructions

### 1. MTN MoMo Developer Account
1. Go to [MTN MoMo Developer Portal](https://momodeveloper.mtn.com/)
2. Create an account and subscribe to Collections API
3. Create a new app and get your API keys
4. Generate User ID and API Key for Collections

### 2. Local Development
1. Clone this repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env`
4. Fill in your MTN MoMo API credentials in `.env`
5. Run the server: `npm start`

### 3. Deploy to Vercel
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add environment variables in Vercel dashboard:
   - `MOMO_BASE_URL`
   - `MOMO_COLLECTION_PRIMARY_KEY`
   - `MOMO_COLLECTION_USER_ID`
   - `MOMO_COLLECTION_API_KEY`
   - `MOMO_COLLECTION_SUBSCRIPTION_KEY`
   - `CALLBACK_URL`
4. Deploy!

### 4. Frontend Integration (React Native Web)

Example usage in your React Native web app:

```javascript
// Request payment
const requestPayment = async (amount, phoneNumber) => {
  try {
    const response = await fetch('https://your-backend.vercel.app/api/request-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'EUR',
        externalId: `tx_${Date.now()}`,
        payer: {
          partyId: phoneNumber
        },
        payerMessage: 'Payment request',
        payeeNote: 'Payment from your app'
      })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Payment request failed:', error);
    throw error;
  }
};

// Check payment status
const checkPaymentStatus = async (referenceId) => {
  try {
    const response = await fetch(`https://your-backend.vercel.app/api/payment-status/${referenceId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Status check failed:', error);
    throw error;
  }
};
```

## Environment Variables

Create a `.env` file with the following variables:

```
MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
MOMO_COLLECTION_PRIMARY_KEY=your_primary_key_here
MOMO_COLLECTION_USER_ID=your_user_id_here
MOMO_COLLECTION_API_KEY=your_api_key_here
MOMO_COLLECTION_SUBSCRIPTION_KEY=your_subscription_key_here
CALLBACK_URL=https://your-app.vercel.app/callback
PORT=3000
```

## Testing

The API uses MTN's sandbox environment by default. For production, change the base URL to the production endpoint and update the target environment.

## Security Notes

- Never commit your `.env` file to version control
- Use environment variables for all sensitive data
- Implement proper authentication for production use
- Add rate limiting for production deployment
- Validate all input data thoroughly

## Support

For MTN MoMo API documentation and support, visit [MTN MoMo Developer Portal](https://momodeveloper.mtn.com/).