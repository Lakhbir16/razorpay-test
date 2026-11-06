const axios = require('axios');
const config = require('../config');

/**
 * Razorpay Tech Partner Service
 * Handles OAuth token operations, Bearer-authenticated API calls,
 * and direct programmatic Sub-Merchant Onboarding via v2 Accounts API.
 */
class RazorpayService {
  /**
   * Helper to generate Basic Auth header for Partner API calls (v2 Accounts API)
   */
  getPartnerAuthHeaders() {
    const keyId = config.razorpay.keyId || config.razorpay.clientId;
    const keySecret = config.razorpay.keySecret || config.razorpay.clientSecret;
    if (!keyId || !keySecret) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required in server/.env for Sub-Merchant Onboarding');
    }
    const token = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    return {
      'Authorization': `Basic ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Programmatic Sub-Merchant Creation (Direct Onboarding from your platform)
   * Calls POST https://api.razorpay.com/v2/accounts
   */
  async createSubMerchant(accountData) {
    const headers = this.getPartnerAuthHeaders();
    const url = `${config.razorpay.accountsApiBaseUrl}/accounts`;

    const response = await axios.post(url, accountData, { headers });
    return response.data;
  }

  /**
   * Fetch Sub-Merchant Account details by Account ID
   */
  async fetchSubMerchant(accountId) {
    const headers = this.getPartnerAuthHeaders();
    const url = `${config.razorpay.accountsApiBaseUrl}/accounts/${accountId}`;

    const response = await axios.get(url, { headers });
    return response.data;
  }

  /**
   * List Onboarded Sub-Merchants
   */
  async listSubMerchants(params = {}) {
    const headers = this.getPartnerAuthHeaders();
    const url = `${config.razorpay.accountsApiBaseUrl}/accounts`;

    const response = await axios.get(url, { headers, params });
    return response.data;
  }

  /**
   * Generates authorization URL for redirecting sub-merchant to Razorpay
   */
  getAuthorizeUrl(state = '') {
    const params = new URLSearchParams({
      client_id: config.razorpay.clientId,
      response_type: 'code',
      redirect_uri: config.razorpay.redirectUri,
      scope: 'read_write',
      state: state || `state_${Date.now()}`
    });

    return `${config.razorpay.authBaseUrl}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token, refresh token & public token
   */
  async getAccessToken(code) {
    if (!config.razorpay.clientId || !config.razorpay.clientSecret) {
      throw new Error('RAZORPAY_CLIENT_ID and RAZORPAY_CLIENT_SECRET are not configured in .env');
    }

    const payload = {
      client_id: config.razorpay.clientId,
      client_secret: config.razorpay.clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: config.razorpay.redirectUri,
      code: code,
      mode: config.razorpay.mode
    };

    const response = await axios.post(`${config.razorpay.authBaseUrl}/token`, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  }

  /**
   * Refresh an expired access token using the refresh token
   */
  async refreshAccessToken(refreshToken) {
    if (!config.razorpay.clientId || !config.razorpay.clientSecret) {
      throw new Error('RAZORPAY_CLIENT_ID and RAZORPAY_CLIENT_SECRET are not configured in .env');
    }

    const payload = {
      client_id: config.razorpay.clientId,
      client_secret: config.razorpay.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    };

    const response = await axios.post(`${config.razorpay.authBaseUrl}/token`, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  }

  /**
   * Generic Bearer request to Razorpay v1 API on behalf of a sub-merchant
   */
  async request(accessToken, method, endpoint, data = null, params = null) {
    if (!accessToken) {
      throw new Error('Access token is required for sub-merchant API requests');
    }

    const url = `${config.razorpay.apiBaseUrl}${endpoint}`;
    const response = await axios({
      method,
      url,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      data,
      params
    });

    return response.data;
  }

  /**
   * Create an Order for the sub-merchant
   * @param {string} accessToken sub-merchant access token
   * @param {object} orderData { amount, currency, receipt, notes }
   */
  async createOrder(accessToken, orderData) {
    return this.request(accessToken, 'POST', '/orders', orderData);
  }

  /**
   * List Orders for the sub-merchant
   */
  async listOrders(accessToken, count = 10) {
    return this.request(accessToken, 'GET', '/orders', null, { count });
  }

  /**
   * List Payments for the sub-merchant
   */
  async listPayments(accessToken, count = 10) {
    return this.request(accessToken, 'GET', '/payments', null, { count });
  }

  /**
   * Fetch payment details by payment ID
   */
  async fetchPayment(accessToken, paymentId) {
    return this.request(accessToken, 'GET', `/payments/${paymentId}`);
  }

  /**
   * Issue a refund for a payment
   * @param {string} accessToken sub-merchant access token
   * @param {string} paymentId
   * @param {object} refundData { amount, speed, notes }
   */
  async issueRefund(accessToken, paymentId, refundData = {}) {
    return this.request(accessToken, 'POST', `/payments/${paymentId}/refund`, refundData);
  }

  /**
   * Fetch refund details by refund ID
   */
  async fetchRefund(accessToken, refundId) {
    return this.request(accessToken, 'GET', `/refunds/${refundId}`);
  }
}

module.exports = new RazorpayService();
