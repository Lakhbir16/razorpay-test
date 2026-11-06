import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MerchantsTab from './components/MerchantsTab';
import OnboardingTab from './components/OnboardingTab';
import PaymentsTab from './components/PaymentsTab';
import FetchApisTab from './components/FetchApisTab';
import WebhooksTab from './components/WebhooksTab';
import GuideTab from './components/GuideTab';
import { api } from './services/api';
import { Users, UserPlus, CreditCard, Search, Radio, BookOpen, CheckCircle, AlertTriangle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('merchants'); // default to OAuth sub-merchants tab
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [serverStatus, setServerStatus] = useState(false);
  const [config, setConfig] = useState(null);
  const [urlNotice, setUrlNotice] = useState(null);
  const [prefilledPaymentId, setPrefilledPaymentId] = useState('');

  // Check URL parameters for OAuth return or errors
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectedAccount = params.get('connected');
    const error = params.get('error');

    if (connectedAccount) {
      setUrlNotice({
        type: 'success',
        message: `Successfully connected Sub-Merchant Account: ${connectedAccount}! You can now test payments and orders.`
      });
      setActiveTab('merchants');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      setUrlNotice({
        type: 'danger',
        message: `OAuth Error: ${decodeURIComponent(error)}`
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Check backend health & config
  const checkHealth = async () => {
    try {
      await api.getHealth();
      setServerStatus(true);
      const conf = await api.getOAuthConfig();
      setConfig(conf);
    } catch (err) {
      setServerStatus(false);
    }
  };

  // Load connected merchants
  const loadMerchants = async () => {
    try {
      const data = await api.getMerchants();
      setMerchants(data);
      if (data.length > 0 && !selectedMerchant) {
        setSelectedMerchant(data[0]);
      } else if (selectedMerchant) {
        // Keep selected up-to-date
        const updated = data.find(m => m.razorpay_account_id === selectedMerchant.razorpay_account_id);
        if (updated) setSelectedMerchant(updated);
      }
    } catch (err) {
      console.error('Failed to load merchants:', err);
    }
  };

  useEffect(() => {
    checkHealth();
    loadMerchants();
  }, []);

  const handleSubMerchantCreated = (newMerchant) => {
    loadMerchants();
    setSelectedMerchant(newMerchant);
  };

  const handleNavigateToFetch = (paymentId) => {
    setPrefilledPaymentId(paymentId);
    setActiveTab('fetch');
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        config={config}
        serverStatus={serverStatus}
        selectedMerchant={selectedMerchant}
        merchants={merchants}
        onSelectMerchant={setSelectedMerchant}
      />

      <main className="app-main">
        {/* URL Banner Notice */}
        {urlNotice && (
          <div className={`banner ${urlNotice.type}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {urlNotice.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              <span>{urlNotice.message}</span>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={() => setUrlNotice(null)}>Dismiss</button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="tabs-nav">
          <button
            className={`tab-btn ${activeTab === 'onboarding' ? 'active' : ''}`}
            onClick={() => setActiveTab('onboarding')}
          >
            <UserPlus size={17} />
            Platform Onboarding (API v2)
          </button>

          <button
            className={`tab-btn ${activeTab === 'merchants' ? 'active' : ''}`}
            onClick={() => setActiveTab('merchants')}
          >
            <Users size={17} />
            OAuth & Sub-Merchants ({merchants.length})
          </button>

          <button
            className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <CreditCard size={17} />
            Payment Gateway & Checkout
          </button>

          <button
            className={`tab-btn ${activeTab === 'fetch' ? 'active' : ''}`}
            onClick={() => setActiveTab('fetch')}
          >
            <Search size={17} />
            Fetch & Fallback APIs
          </button>

          <button
            className={`tab-btn ${activeTab === 'webhooks' ? 'active' : ''}`}
            onClick={() => setActiveTab('webhooks')}
          >
            <Radio size={17} />
            Webhooks & Simulator
          </button>

          <button
            className={`tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
            onClick={() => setActiveTab('guide')}
          >
            <BookOpen size={17} />
            Partner Guide & Docs
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'onboarding' && (
          <OnboardingTab
            onSubMerchantCreated={handleSubMerchantCreated}
            onSelectMerchant={(merchant) => {
              setSelectedMerchant(merchant);
              setActiveTab('payments');
            }}
          />
        )}

        {activeTab === 'merchants' && (
          <MerchantsTab
            merchants={merchants}
            selectedMerchant={selectedMerchant}
            onSelectMerchant={setSelectedMerchant}
            onRefreshList={loadMerchants}
            config={config}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentsTab
            selectedMerchant={selectedMerchant}
            onNavigateToFetch={handleNavigateToFetch}
          />
        )}

        {activeTab === 'fetch' && (
          <FetchApisTab
            selectedMerchant={selectedMerchant}
            initialPaymentId={prefilledPaymentId}
          />
        )}

        {activeTab === 'webhooks' && (
          <WebhooksTab
            config={config}
            selectedMerchant={selectedMerchant}
            onRefreshMerchants={loadMerchants}
          />
        )}

        {activeTab === 'guide' && (
          <GuideTab />
        )}
      </main>
    </div>
  );
}
