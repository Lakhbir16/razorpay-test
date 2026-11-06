# Razorpay Tech Partner OAuth & Payment Gateway Testing Suite

Official integration testing workbench built for **Tech Partner MID: `JZjo2exOZH0VR5`**.

This full-stack project (Node.js Express + React Vite) implements and tests the complete Razorpay Partner OAuth lifecycle and sub-merchant payment processing.

---

## 🚀 Features Implemented

1. **Direct Platform Onboarding (Accounts API v2)**:
   - Onboard sub-merchants directly from your own website without sending them to Razorpay's login screen.
   - Collects Legal Business Name, Contact Name, Email, Phone, Business Constitution, Category, PAN & Address.
   - Calls `POST https://api.razorpay.com/v2/accounts` using your Tech Partner API credentials.
   - Automatically provisions a sub-merchant account linked under your Partner MID (`JZjo2exOZH0VR5`).

2. **OAuth 2.0 Partner Flow**:
   - Generates official Authorization URL (`scope: read_write`).
   - Handles OAuth redirect callback and exchanges code for:
     - `access_token` (Sub-merchant Bearer token for server API calls)
     - `public_token` (Used on client-side for Razorpay Checkout)
     - `refresh_token` (Used to regenerate access token)
     - `razorpay_account_id` (Sub-merchant Account ID)
   - Auto-saves connected sub-merchants in `server/data/merchants.json`.
   - 1-click **Refresh Token** API before the 90-day expiry.
   - Manual token entry for instant testing without completing web redirect.

2. **Sub-Merchant Payment Processing**:
   - Order creation using `Authorization: Bearer <access_token>`.
   - Client-side checkout modal using `public_token`.
   - Captured payment verification and signature validation.

3. **Fallback Fetch APIs**:
   - **Fetch Payment with ID**: `GET /v1/payments/:id`
   - **Fetch Refund with ID**: `GET /v1/refunds/:id`
   - **Issue Refund**: `POST /v1/payments/:id/refund`
   - **List Recent Orders & Payments** for the connected sub-merchant.

4. **Webhooks & Simulator**:
   - Subscribes and verifies HMAC SHA256 signatures for all 6 required events:
     - `payment.authorized`
     - `payment.captured`
     - `payment.failed`
     - `refund.processed`
     - `refund.failed`
     - `account.app.authorization_revoked` (automatically marks merchant as `revoked`)
   - Built-in **Webhook Simulator** to test event handling locally without ngrok.
   - Live incoming webhook inspector.

---

## 📁 Project Structure

```
Razorpay-Test/
├── server/                          # Node.js Express Backend (Port 5000)
│   ├── src/
│   │   ├── index.js                 # Server entry & webhook signature capture
│   │   ├── config.js                # Environment configuration
│   │   ├── storage.js               # JSON store for merchants & webhooks
│   │   ├── services/
│   │   │   └── razorpay.js          # Razorpay OAuth & Bearer API client
│   │   └── routes/
│   │       ├── oauth.js             # OAuth URL, token exchange, refresh
│   │       ├── merchants.js         # Merchant management
│   │       ├── payments.js          # Orders, Checkout, Fetch & Refund APIs
│   │       └── webhooks.js          # Webhook listener & simulator
│   ├── .env.example
│   └── .env
│
├── client/                          # React + Vite Frontend (Port 5173)
│   ├── src/
│   │   ├── App.jsx                  # Main dashboard layout & tabs
│   │   ├── services/api.js          # API client for backend
│   │   └── components/
│   │       ├── Header.jsx           # Partner MID & active merchant switch
│   │       ├── MerchantsTab.jsx     # OAuth Connect & token list
│   │       ├── PaymentsTab.jsx      # Order creation & Razorpay modal
│   │       ├── FetchApisTab.jsx     # Fetch Payment, Refund & List APIs
│   │       ├── WebhooksTab.jsx      # Webhook log & simulator
│   │       └── GuideTab.jsx         # Partner docs & setup checklist
│   └── index.html                   # Includes Razorpay checkout.js
│
└── package.json
```

---

## 🛠️ Quick Setup Guide

### Step 1: Configure Razorpay Dashboard

1. Log into your [Razorpay Dashboard](https://dashboard.razorpay.com/) (as Partner MID `JZjo2exOZH0VR5`).
2. Go to **Applications** (or **Partner OAuth**).
3. Create a new application:
   - **Application Name**: `Tech Partner Test App`
   - **Redirect URI**: `http://localhost:5000/api/oauth/callback`
   - **Webhook URL**: `http://localhost:5000/api/webhooks/razorpay` (or your ngrok URL)
   - **Scope**: `read_write`
4. Copy the **Client ID** and **Client Secret**.

### Step 2: Configure Environment Variables

Open `server/.env` and enter your credentials:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173

RAZORPAY_CLIENT_ID=your_client_id_from_dashboard
RAZORPAY_CLIENT_SECRET=your_client_secret_from_dashboard
RAZORPAY_REDIRECT_URI=http://localhost:5000/api/oauth/callback
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
RAZORPAY_MODE=test
```

### Step 3: Run the Application

In terminal 1 (start backend server):
```bash
npm run server
```
*Backend runs at `http://localhost:5000`*

In terminal 2 (start React frontend):
```bash
npm run client
```
*Frontend opens at `http://localhost:5173`*

---

## 🧪 Testing the Integration

1. Open `http://localhost:5173` in your browser.
2. In the **OAuth & Sub-Merchants** tab:
   - Click **Connect Sub-Merchant Account**.
   - You will be redirected to Razorpay to authorize as a merchant.
   - Upon consent, Razorpay redirects back, and your sub-merchant's `razorpay_account_id`, `access_token`, and `public_token` will appear in the table.
3. Switch to the **Payment Gateway & Checkout** tab:
   - Click **Create Order on Sub-Merchant**.
   - Click **Open Razorpay Checkout Modal** to test paying on behalf of the sub-merchant!
4. In the **Fetch & Fallback APIs** tab:
   - Paste the `payment_id` and test the **Fetch Payment API**.
   - Test issuing refunds and fetching refund status.
5. In the **Webhooks & Simulator** tab:
   - Trigger simulated webhooks (such as `payment.captured` or `account.app.authorization_revoked`) and inspect the payload logs.
