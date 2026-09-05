import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Session {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  expiresAt: string;
  createdAt: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Mock data for demo
    setSessions([
      {
        id: '1',
        deviceInfo: 'Chrome on Windows',
        ipAddress: '192.168.1.100',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        deviceInfo: 'Safari on MacOS',
        ipAddress: '192.168.1.101',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
    ]);
    setLoading(false);
  }, []);

  const handleRevokeSession = (id: string) => {
    if (confirm('Revoke this session?')) {
      alert('✅ Session revoked');
      setSessionsSessions(sessions.filter(s => s.id !== id));
    }
  };

  const handleRevokeAll = () => {
    if (confirm('Logout from all other devices?')) {
      alert('✅ All other sessions revoked');
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui', padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <h1>🔐 Active Sessions</h1>
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

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
        <p>Manage your active sessions and logout from devices you don't recognize.</p>
        <button
          onClick={handleRevokeAll}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Logout From All Other Devices
        </button>
      </div>

      {loading ? (
        <p>Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <p>No active sessions</p>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {sessions.map((s) => (
            <div
              key={s.id}
              style={{
                padding: '15px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa',
              }}
            >
              <div style={{ marginBottom: '10px' }}>
                <strong>Device:</strong> {s.deviceInfo}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>IP Address:</strong> {s.ipAddress}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Created:</strong> {new Date(s.createdAt).toLocaleString()}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Expires:</strong> {new Date(s.expiresAt).toLocaleString()}
              </div>
              <button
                onClick={() => handleRevokeSession(s.id)}
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
