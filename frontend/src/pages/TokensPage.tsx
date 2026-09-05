import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

interface Token {
  id: string;
  name: string;
  lastUsed: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [expiration, setExpiration] = useState('7d');
  const [newToken, setNewToken] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const response = await apiClient.getApiTokens();
      if (response.success) {
        setTokens(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.createApiToken(tokenName, expiration === '0' ? '' : expiration);
      if (response.success) {
        setNewToken(response.data.token);
        setTokenName('');
        setExpiration('7d');
        alert('✅ Token created! Copy it now - it won\'t be shown again.');
        fetchTokens();
      }
    } catch (err) {
      console.error('Failed to create token:', err);
      alert('❌ Failed to create token');
    }
  };

  const handleDeleteToken = async (id: string) => {
    if (!confirm('Delete this token?')) return;
    try {
      await apiClient.revokeApiToken(id);
      alert('✅ Token deleted');
      fetchTokens();
    } catch (err) {
      console.error('Failed to delete token:', err);
      alert('❌ Failed to delete token');
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui', padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <h1>🔑 API Tokens</h1>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Dashboard
        </button>
      </div>

      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            marginBottom: '20px',
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          + Generate Token
        </button>
      )}

      {showCreateForm && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <h3>Generate New API Token</h3>
          <form onSubmit={handleCreateToken}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Token Name</label>
              <input
                type="text"
                placeholder="e.g., Mobile App, Backend Service"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                required
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Expiration</label>
              <select
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              >
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
                <option value="90d">90 days</option>
                <option value="0">Never</option>
              </select>
            </div>
            <div>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px',
                }}
              >
                Generate
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {newToken && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#d4edda', borderRadius: '4px', border: '1px solid #c3e6cb' }}>
          <strong>✅ Token Generated!</strong>
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff', borderRadius: '3px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {newToken}
          </div>
          <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
            ⚠️ Save this token now. You won't be able to see it again!
          </p>
        </div>
      )}

      <h2>Your Tokens ({tokens.length})</h2>
      {loading ? (
        <p>Loading tokens...</p>
      ) : tokens.length === 0 ? (
        <p>No API tokens yet. Create one to get started!</p>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {tokens.map((t) => (
            <div
              key={t.id}
              style={{
                padding: '15px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa',
              }}
            >
              <div style={{ marginBottom: '10px' }}>
                <strong>{t.name}</strong>
              </div>
              <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                <div>Created: {new Date(t.createdAt).toLocaleDateString()}</div>
                {t.lastUsed && <div>Last Used: {new Date(t.lastUsed).toLocaleString()}</div>}
                {t.expiresAt && <div>Expires: {new Date(t.expiresAt).toLocaleDateString()}</div>}
              </div>
              <button
                onClick={() => handleDeleteToken(t.id)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
