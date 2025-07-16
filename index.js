const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MTN MoMo API Configuration
const MOMO_CONFIG = {
  BASE_URL: process.env.MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com',
  COLLECTION_PRIMARY_KEY: process.env.MOMO_COLLECTION_PRIMARY_KEY,
  COLLECTION_USER_ID: process.env.MOMO_COLLECTION_USER_ID,
  COLLECTION_API_KEY: process.env.MOMO_COLLECTION_API_KEY,
  COLLECTION_SUBSCRIPTION_KEY: process.env.MOMO_COLLECTION_SUBSCRIPTION_KEY,
  CALLBACK_URL: process.env.CALLBACK_URL || 'https://your-app.vercel.app/callback'
};

// Helper function to get access token
async function getAccessToken() {
  try {
    const response = await axios.post(
      `${MOMO_CONFIG.BASE_URL}/collection/token/`,
      {},
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${MOMO_CONFIG.COLLECTION_USER_ID}:${MOMO_CONFIG.COLLECTION_API_KEY}`).toString('base64')}`,
          'Ocp-Apim-Subscription-Key': MOMO_CONFIG.COLLECTION_SUBSCRIPTION_KEY
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error.response?.data || error.message);
    throw new Error('Failed to get access token');
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'MoMo Payments Backend API', status: 'running' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Request to pay endpoint
app.post('/api/request-payment', async (req, res) => {
  try {
    const { amount, currency, externalId, payer, payerMessage, payeeNote } = req.body;

    // Validate required fields
    if (!amount || !currency || !externalId || !payer?.partyId) {
      return res.status(400).json({
        error: 'Missing required fields: amount, currency, externalId, payer.partyId'
      });
    }

    // Get access token
    const accessToken = await getAccessToken();
    
    // Generate unique reference ID
    const referenceId = uuidv4();

    // Prepare payment request
    const paymentRequest = {
      amount: amount.toString(),
      currency: currency || 'EUR',
      externalId: externalId,
      payer: {
        partyIdType: 'MSISDN',
        partyId: payer.partyId
      },
      payerMessage: payerMessage || 'Payment request',
      payeeNote: payeeNote || 'Payment from your app'
    };

    // Make payment request
    const response = await axios.post(
      `${MOMO_CONFIG.BASE_URL}/collection/v1_0/requesttopay`,
      paymentRequest,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': 'sandbox',
          'Ocp-Apim-Subscription-Key': MOMO_CONFIG.COLLECTION_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      referenceId: referenceId,
      message: 'Payment request submitted successfully'
    });

  } catch (error) {
    console.error('Payment request error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Payment request failed',
      details: error.response?.data || error.message
    });
  }
});

// Check payment status endpoint
app.get('/api/payment-status/:referenceId', async (req, res) => {
  try {
    const { referenceId } = req.params;

    // Get access token
    const accessToken = await getAccessToken();

    // Check payment status
    const response = await axios.get(
      `${MOMO_CONFIG.BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Target-Environment': 'sandbox',
          'Ocp-Apim-Subscription-Key': MOMO_CONFIG.COLLECTION_SUBSCRIPTION_KEY
        }
      }
    );

    res.json({
      success: true,
      status: response.data.status,
      data: response.data
    });

  } catch (error) {
    console.error('Status check error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to check payment status',
      details: error.response?.data || error.message
    });
  }
});

// Get account balance endpoint
app.get('/api/account-balance', async (req, res) => {
  try {
    // Get access token
    const accessToken = await getAccessToken();

    // Get account balance
    const response = await axios.get(
      `${MOMO_CONFIG.BASE_URL}/collection/v1_0/account/balance`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Target-Environment': 'sandbox',
          'Ocp-Apim-Subscription-Key': MOMO_CONFIG.COLLECTION_SUBSCRIPTION_KEY
        }
      }
    );

    res.json({
      success: true,
      balance: response.data
    });

  } catch (error) {
    console.error('Balance check error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to get account balance',
      details: error.response?.data || error.message
    });
  }
});

// Callback endpoint for MoMo notifications
app.post('/callback', (req, res) => {
  console.log('MoMo callback received:', req.body);
  
  // Process the callback data here
  // You can update your database, send notifications, etc.
  
  res.status(200).json({ message: 'Callback received successfully' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});