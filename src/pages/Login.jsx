import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/*
  WARNING: this stores API key/secret in localStorage for demo only.
  For production, store secrets server-side and never in the browser.
*/
export default function Login() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('delta_apiKey') || '');
  const [apiSecret, setApiSecret] = useState(localStorage.getItem('delta_apiSecret') || '');
  const [useTest, setUseTest] = useState(localStorage.getItem('delta_useTest') === 'true');
  const navigate = useNavigate();

  const onSave = (e) => {
    e.preventDefault();
    localStorage.setItem('delta_apiKey', apiKey);
    localStorage.setItem('delta_apiSecret', apiSecret);
    localStorage.setItem('delta_useTest', useTest ? 'true' : 'false');
    alert('Saved (dev only). You can now go to Products or Monitor.');
    navigate('/products');
  };

  return (
    <form onSubmit={onSave} style={{ maxWidth: 680 }}>
      <h2>Login / Save API creds (dev only)</h2>

      <div style={{ marginBottom: 8 }}>
        <label>API Key</label><br />
        <input value={apiKey} onChange={e => setApiKey(e.target.value)} style={{ width: '100%' }} />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>API Secret</label><br />
        <input value={apiSecret} onChange={e => setApiSecret(e.target.value)} style={{ width: '100%' }} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>
          <input type="checkbox" checked={useTest} onChange={e => setUseTest(e.target.checked)} />
          {' '}Use Testnet
        </label>
      </div>

      <button type="submit">Save (localStorage)</button>

      <p style={{ color: '#666', marginTop: 12 }}>
        Note: Keeping secrets in the browser is unsafe. Use a backend for production.
      </p>
    </form>
  );
}
