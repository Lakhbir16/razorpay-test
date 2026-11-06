const API_BASE = 'http://localhost:5000/api';

export const api = {
  // Config & Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },
  async getOAuthConfig() {
    const res = await fetch(`${API_BASE}/oauth/config`);
    return res.json();
  },

  // OAuth
  async getConnectUrl(state = '') {
    const res = await fetch(`${API_BASE}/oauth/connect-url?state=${encodeURIComponent(state)}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to get connect URL');
    }
    return res.json();
  },
  async exchangeCode(code) {
    const res = await fetch(`${API_BASE}/oauth/exchange-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.description || JSON.stringify(err.error || err));
    }
    return res.json();
  },
  async refreshToken(accountId) {
    const res = await fetch(`${API_BASE}/oauth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(JSON.stringify(err.error || err));
    }
    return res.json();
  },

  // Merchants
  async getMerchants() {
    const res = await fetch(`${API_BASE}/merchants`);
    return res.json();
  },
  async deleteMerchant(accountId) {
    const res = await fetch(`${API_BASE}/merchants/${accountId}`, {
      method: 'DELETE'
    });
    return res.json();
  },
  async manualAddMerchant(data) {
    const res = await fetch(`${API_BASE}/merchants/manual-add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save merchant');
    }
    return res.json();
  },

  // Payments & Orders
  async createOrder(data) {
    const res = await fetch(`${API_BASE}/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(JSON.stringify(err.error || err));
    }
    return res.json();
  },
  async listOrders(accountId, count = 10) {
    const res = await fetch(`${API_BASE}/payments/orders?accountId=${accountId}&count=${count}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(JSON.stringify(err.error || err));
    }
    return res.json();
  },
  async listPayments(accountId, count = 10) {
    const res = await fetch(`${API_BASE}/payments/list?accountId=${accountId}&count=${count}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(JSON.stringify(err.error || err));
    }
    return res.json();
  },
  async fetchPayment(accountId, paymentId) {
    const res = await fetch(`${API_BASE}/payments/${paymentId}?accountId=${accountId}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(JSON.stringify(err.error || err));
    }
    return res.json();
  },
  async issueRefund(accountId, paymentId, refundData) {
    const res = await fetch(`${API_BASE}/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, ...refundData })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(JSON.stringify(err.error || err));
    }
    return res.json();
  },
  async fetchRefund(accountId, refundId) {
    const res = await fetch(`${API_BASE}/payments/refunds/${refundId}?accountId=${accountId}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(JSON.stringify(err.error || err));
    }
    return res.json();
  },

  // Webhooks
  async getWebhookLogs() {
    const res = await fetch(`${API_BASE}/webhooks/logs`);
    return res.json();
  },
  async clearWebhookLogs() {
    const res = await fetch(`${API_BASE}/webhooks/logs`, { method: 'DELETE' });
    return res.json();
  },
  async simulateWebhook(data) {
    const res = await fetch(`${API_BASE}/webhooks/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Direct Platform Onboarding (Accounts API v2)
  async createSubMerchant(data) {
    const res = await fetch(`${API_BASE}/onboarding/create-submerchant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(JSON.stringify(err.error || err));
    }
    return res.json();
  },
  async fetchSubMerchantAccount(accountId) {
    const res = await fetch(`${API_BASE}/onboarding/accounts/${accountId}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(JSON.stringify(err.error || err));
    }
    return res.json();
  },
  async listPlatformSubMerchants() {
    const res = await fetch(`${API_BASE}/onboarding/accounts`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(JSON.stringify(err.error || err));
    }
    return res.json();
  }
};
