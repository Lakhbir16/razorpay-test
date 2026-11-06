import React from 'react';
import { BookOpen, ExternalLink, ShieldCheck, CheckSquare, Code2 } from 'lucide-react';

export default function GuideTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Intro Card */}
      <div className="card">
        <h2 className="card-title">
          <BookOpen size={20} color="#0284c7" />
          Razorpay Tech Partner OAuth & Payment Implementation Guide
        </h2>
        <p className="card-desc">
          Reference guide tailored for Partner MID <code>JZjo2exOZH0VR5</code>.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Step 1 */}
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Step 1: Create the Application in Razorpay Dashboard
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.75rem' }}>
              Log in to the Razorpay Dashboard using your Partner account. Navigate to <strong>Applications → Partner OAuth</strong> and click <strong>Create Application</strong>.
            </p>
            <ul style={{ fontSize: '0.85rem', color: '#475569', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li><strong>App Name:</strong> Your platform name</li>
              <li><strong>Redirect URI:</strong> Razorpay blocks <code>localhost</code>. Use a free HTTPS tunnel like localtunnel or ngrok (e.g. <code>https://your-tunnel.loca.lt/api/oauth/callback</code>). Run <code>npm run tunnel</code> to generate one instantly!</li>
              <li><strong>Webhook URL:</strong> <code>https://your-tunnel.loca.lt/api/webhooks/razorpay</code></li>
              <li>Once created, paste the <code>Client ID</code>, <code>Client Secret</code>, and the tunnel <code>Redirect URI</code> into <code>server/.env</code>.</li>
            </ul>
          </div>

          {/* Step 2 */}
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Step 2: Initiate Authorization using URL
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
              Redirect the sub-merchant to Razorpay's authorization endpoint:
            </p>
            <pre className="json-box" style={{ padding: '0.75rem' }}>
{`https://auth.razorpay.com/authorize?
  client_id={YOUR_CLIENT_ID}&
  response_type=code&
  scope=read_write&
  state={RANDOM_STATE}&
  redirect_uri=http://localhost:5000/api/oauth/callback`}
            </pre>
          </div>

          {/* Step 3 */}
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Step 3: Exchange Authorization Code for Access Token
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
              When the sub-merchant consents, Razorpay redirects back to your callback with <code>?code=...</code>.
              Your backend makes a <code>POST https://auth.razorpay.com/token</code> request:
            </p>
            <pre className="json-box" style={{ padding: '0.75rem' }}>
{`POST https://auth.razorpay.com/token
Content-Type: application/json

{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "grant_type": "authorization_code",
  "redirect_uri": "http://localhost:5000/api/oauth/callback",
  "code": "AUTH_CODE_FROM_CALLBACK",
  "mode": "test"
}`}
            </pre>
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#475569' }}>
              <strong>Response received:</strong>
              <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
                <li><code>access_token</code>: Used as <code>Authorization: Bearer &lt;access_token&gt;</code> for backend API calls.</li>
                <li><code>public_token</code>: Used in client-side Razorpay Checkout modal (<code>key: public_token</code>).</li>
                <li><code>refresh_token</code>: Used to regenerate expired tokens (valid for 90 days).</li>
                <li><code>razorpay_account_id</code>: The sub-merchant's unique account ID.</li>
              </ul>
            </div>
          </div>

          {/* Step 4 */}
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Step 4: Making API Calls on Behalf of Sub-Merchant
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
              Unlike standard Razorpay integrations which use <code>rzp_test_...:secret</code> Basic auth, Tech Partner integrations use:
            </p>
            <pre className="json-box" style={{ padding: '0.75rem' }}>
{`POST https://api.razorpay.com/v1/orders
Authorization: Bearer <SUB_MERCHANT_ACCESS_TOKEN>
Content-Type: application/json

{
  "amount": 10000,
  "currency": "INR",
  "receipt": "receipt_123"
}`}
            </pre>
          </div>

          {/* Step 5 */}
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Step 5: Webhooks & Account Revocation Handling
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
              Always subscribe to <code>account.app.authorization_revoked</code>. When a sub-merchant disconnects your app from their dashboard,
              Razorpay sends this webhook event so you can revoke their tokens and stop scheduled jobs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
