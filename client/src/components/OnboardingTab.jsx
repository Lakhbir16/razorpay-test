import React, { useState } from 'react';
import { api } from '../services/api';
import { UserPlus, Building2, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, FileText, ExternalLink } from 'lucide-react';

const BUSINESS_TYPES = [
  { value: 'proprietorship', label: 'Sole Proprietorship' },
  { value: 'individual', label: 'Individual / Freelancer' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'private_limited', label: 'Private Limited Company' },
  { value: 'public_limited', label: 'Public Limited Company' },
  { value: 'llp', label: 'Limited Liability Partnership (LLP)' },
  { value: 'trust', label: 'Trust / NGO' }
];

const CATEGORIES = [
  { value: 'ecommerce', label: 'E-commerce & Retail' },
  { value: 'services', label: 'Professional & Business Services' },
  { value: 'education', label: 'Education & Coaching' },
  { value: 'healthcare', label: 'Healthcare & Clinic' },
  { value: 'food_and_beverage', label: 'Food & Restaurants' },
  { value: 'software', label: 'SaaS & Digital Products' },
  { value: 'logistics', label: 'Logistics & Transport' }
];

export default function OnboardingTab({ onSubMerchantCreated, onSelectMerchant }) {
  const [formData, setFormData] = useState({
    legal_business_name: '',
    contact_name: '',
    email: '',
    phone: '',
    business_type: 'proprietorship',
    category: 'ecommerce',
    subcategory: 'fashion_and_apparel',
    description: '',
    pan: '',
    gst: '',
    street1: '',
    city: '',
    state: '',
    postal_code: ''
  });

  const [loading, setLoading] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSubMerchant = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setCreatedResult(null);
    setLoading(true);

    try {
      const res = await api.createSubMerchant(formData);
      setCreatedResult(res);
      setSuccessMsg(`Sub-Merchant Account ${res.account.id} created successfully on Razorpay!`);
      if (onSubMerchantCreated) {
        onSubMerchantCreated(res.merchant);
      }
    } catch (err) {
      setErrorMsg(`Failed to onboard sub-merchant: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fillSampleData = () => {
    const timestamp = Date.now().toString().slice(-4);
    setFormData({
      legal_business_name: `QuickStore Retail ${timestamp}`,
      contact_name: `Rohan Sharma`,
      email: `merchant_${timestamp}@example.com`,
      phone: `98765${timestamp}1`,
      business_type: 'proprietorship',
      category: 'ecommerce',
      subcategory: 'fashion_and_apparel',
      description: 'Online apparel and accessories retail store',
      pan: `ABCDE${timestamp}F`,
      gst: `27ABCDE${timestamp}F1Z5`,
      street1: 'Shop 42, Market Complex',
      city: 'Mumbai',
      state: 'Maharashtra',
      postal_code: '400001'
    });
  };

  return (
    <div>
      {/* Alert Banners */}
      {errorMsg && (
        <div className="banner danger">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={() => setErrorMsg('')}>Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="banner success">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={() => setSuccessMsg('')}>Dismiss</button>
        </div>
      )}

      {/* Main Container */}
      <div className="card">
        <div className="card-title-row">
          <div>
            <h2 className="card-title">
              <UserPlus size={20} color="#0284c7" />
              Direct Platform Sub-Merchant Onboarding (Accounts API v2)
            </h2>
            <p className="card-desc" style={{ marginTop: '4px' }}>
              Create and link sub-merchant accounts directly from your platform without sending users to Razorpay's login screen.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fillSampleData}
          >
            Fill Sample Test Data
          </button>
        </div>

        {/* Onboarding Form */}
        <form onSubmit={handleCreateSubMerchant}>
          {/* Section 1: Business Identity */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building2 size={16} color="#0284c7" /> 1. Business & Contact Information
            </h3>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Legal Business Name *</label>
                <input
                  type="text"
                  name="legal_business_name"
                  required
                  className="form-input"
                  placeholder="e.g. Apex Traders"
                  value={formData.legal_business_name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Person Name *</label>
                <input
                  type="text"
                  name="contact_name"
                  required
                  className="form-input"
                  placeholder="e.g. Rajesh Kumar"
                  value={formData.contact_name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sub-Merchant Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="form-input"
                  placeholder="merchant@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sub-Merchant Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  className="form-input"
                  placeholder="9876543210 (10 digits)"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Business Classification */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
              2. Business Classification & Type
            </h3>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Business Constitution *</label>
                <select
                  name="business_type"
                  className="form-select"
                  value={formData.business_type}
                  onChange={handleChange}
                >
                  {BUSINESS_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Industry Category *</label>
                <select
                  name="category"
                  className="form-select"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Business Description</label>
                <input
                  type="text"
                  name="description"
                  className="form-input"
                  placeholder="Briefly describe products/services sold"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subcategory</label>
                <input
                  type="text"
                  name="subcategory"
                  className="form-input"
                  placeholder="e.g. fashion_and_apparel"
                  value={formData.subcategory}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Legal & Address */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
              3. Legal Tax ID & Registered Address (Optional for initial sandbox creation)
            </h3>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Business PAN</label>
                <input
                  type="text"
                  name="pan"
                  className="form-input"
                  placeholder="e.g. ABCDE1234F"
                  value={formData.pan}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">GSTIN (Optional)</label>
                <input
                  type="text"
                  name="gst"
                  className="form-input"
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  value={formData.gst}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  name="street1"
                  className="form-input"
                  placeholder="e.g. 100 Main Road"
                  value={formData.street1}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">City, State & Pincode</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    name="city"
                    className="form-input"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    name="state"
                    className="form-input"
                    placeholder="State"
                    value={formData.state}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    name="postal_code"
                    className="form-input"
                    placeholder="Pincode"
                    value={formData.postal_code}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}
            >
              {loading ? 'Creating Sub-Merchant on Razorpay...' : 'Create & Onboard Sub-Merchant'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Result Inspector */}
      {createdResult && (
        <div className="card" style={{ background: '#ecfdf5', border: '1px solid #6ee7b7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={24} color="#059669" />
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#065f46' }}>
                  Sub-Merchant Account Created on Razorpay!
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#047857' }}>
                  Account ID: <strong>{createdResult.account.id}</strong> (Status: <code>{createdResult.account.status}</code>)
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-primary"
                onClick={() => onSelectMerchant(createdResult.merchant)}
              >
                <ArrowRight size={15} /> Select this Sub-Merchant for Payments
              </button>
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#064e3b', marginBottom: '0.35rem' }}>
              API Response from <code>POST /v2/accounts</code>:
            </h4>
            <pre className="json-box" style={{ background: '#064e3b', color: '#a7f3d0' }}>
              {JSON.stringify(createdResult.account, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
