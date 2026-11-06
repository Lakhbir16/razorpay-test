const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '../data');
const MERCHANTS_FILE = path.join(DATA_DIR, 'merchants.json');
const WEBHOOKS_FILE = path.join(DATA_DIR, 'webhooks.json');

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function initFile(filePath, defaultContent = []) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2), 'utf8');
  }
}

initFile(MERCHANTS_FILE, []);
initFile(WEBHOOKS_FILE, []);

function readJson(file) {
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
    return [];
  }
}

function writeJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing to ${file}:`, err.message);
  }
}

const storage = {
  // Merchant operations
  getMerchants() {
    return readJson(MERCHANTS_FILE);
  },

  getMerchant(accountId) {
    const merchants = this.getMerchants();
    return merchants.find(m => m.razorpay_account_id === accountId);
  },

  saveMerchant(tokenData) {
    const merchants = this.getMerchants();
    const existingIndex = merchants.findIndex(m => m.razorpay_account_id === tokenData.razorpay_account_id);
    
    const merchantRecord = {
      ...tokenData,
      updated_at: new Date().toISOString(),
      expires_at: tokenData.expires_in 
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() 
        : null,
      status: 'active'
    };

    if (existingIndex >= 0) {
      merchants[existingIndex] = {
        ...merchants[existingIndex],
        ...merchantRecord
      };
    } else {
      merchantRecord.created_at = new Date().toISOString();
      merchants.push(merchantRecord);
    }

    writeJson(MERCHANTS_FILE, merchants);
    return merchantRecord;
  },

  updateMerchantStatus(accountId, status) {
    const merchants = this.getMerchants();
    const merchant = merchants.find(m => m.razorpay_account_id === accountId);
    if (merchant) {
      merchant.status = status;
      merchant.updated_at = new Date().toISOString();
      writeJson(MERCHANTS_FILE, merchants);
    }
    return merchant;
  },

  deleteMerchant(accountId) {
    const merchants = this.getMerchants();
    const filtered = merchants.filter(m => m.razorpay_account_id !== accountId);
    writeJson(MERCHANTS_FILE, filtered);
    return filtered;
  },

  // Webhook log operations
  saveWebhook(event) {
    const webhooks = readJson(WEBHOOKS_FILE);
    const entry = {
      id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      received_at: new Date().toISOString(),
      event: event.event,
      accountId: event.account_id,
      payload: event
    };
    // keep last 100 webhooks
    webhooks.unshift(entry);
    if (webhooks.length > 100) {
      webhooks.pop();
    }
    writeJson(WEBHOOKS_FILE, webhooks);
    return entry;
  },

  getWebhooks() {
    return readJson(WEBHOOKS_FILE);
  },

  clearWebhooks() {
    writeJson(WEBHOOKS_FILE, []);
    return [];
  }
};

module.exports = storage;
