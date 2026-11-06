const express = require('express');
const cors = require('cors');
const config = require('./config');

const oauthRoutes = require('./routes/oauth');
const merchantRoutes = require('./routes/merchants');
const paymentRoutes = require('./routes/payments');
const webhookRoutes = require('./routes/webhooks');
const onboardingRoutes = require('./routes/onboarding');

const app = express();

// Enable CORS for frontend
app.use(cors({
  origin: '*', // Allow local frontend testing
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Razorpay-Signature']
}));

// Capture raw body for webhook verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/oauth', oauthRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/onboarding', onboardingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Razorpay Tech Partner OAuth & Payment API Server',
    mode: config.razorpay.mode,
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(` Razorpay Tech Partner Server is running!`);
  console.log(` Port: ${config.port}`);
  console.log(` Health: http://localhost:${config.port}/api/health`);
  console.log(` OAuth Callback URL: ${config.razorpay.redirectUri}`);
  console.log(` Webhook URL: http://localhost:${config.port}/api/webhooks/razorpay`);
  console.log(`====================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] Port ${config.port} is already in use by another process.`);
    console.error(`You can kill the existing process or restart your terminal.\n`);
  } else {
    console.error('\n[ERROR] Server error:', err.message);
  }
});
