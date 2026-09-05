import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  isActive: boolean;
}

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
}

export default function ProfilePage({ user, onLogout }: ProfilePageProps) {
  const [twoFASetup, setTwoFASetup] = useState<{ secret?: string; qrCode?: string } | null>(null);
  const [twoFAToken, setTwoFAToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSetup2FA = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await apiClient.setup2FA();
      if (response.success) {
        setTwoFASetup(response.data);
        setMessage('Scan the QR code with your authenticator app');
      } else {
        setMessage('Failed to setup 2FA');
      }
    } catch (err) {
      setMessage('Error setting up 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!twoFASetup?.secret || !twoFAToken) {
      setMessage('Please enter the token');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await apiClient.verify2FA(twoFASetup.secret, twoFAToken);
      if (response.success) {
        setMessage('2FA enabled successfully!');
        setTwoFASetup(null);
        setTwoFAToken('');
      } else {
        setMessage('Invalid 2FA token');
      }
    } catch (err) {
      setMessage('Error verifying 2FA token');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div style={{ fontFamily: 'system-ui', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>👤 User Profile</h1>
        <div>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '8px 16px',
              marginRight: '10px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Dashboard
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #dee2e6' }}>
        <h3 style={{ marginTop: '0' }}>Account Information</h3>
        <div style={{ marginBottom: '10px' }}>
          <strong>Name:</strong> {user.firstName} {user.lastName}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <strong>Email:</strong> {user.email}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <strong>Status:</strong> {user.isActive ? 'Active' : 'Inactive'}
        </div>
      </div>

      <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #dee2e6' }}>
        <h3 style={{ marginTop: '0' }}>🔐 Two-Factor Authentication</h3>

        {!twoFASetup ? (
          <div>
            <p>Enhance your account security with two-factor authentication (2FA).</p>
            <button
              onClick={handleSetup2FA}
              disabled={loading}
              style={{
                padding: '10px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Setting up...' : 'Enable 2FA'}
            </button>
          </div>
        ) : (
          <div>
            <p>
              <strong>Step 1:</strong> Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            {twoFASetup.qrCode && (
              <img
                src={twoFASetup.qrCode}
                alt="2FA QR Code"
                style={{ marginBottom: '15px', border: '1px solid #dee2e6', padding: '10px' }}
              />
            )}

            <p>
              <strong>Step 2:</strong> Enter the 6-digit code from your app
            </p>
            <input
              type="text"
              value={twoFAToken}
              onChange={(e) => setTwoFAToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              style={{
                padding: '8px',
                fontSize: '20px',
                textAlign: 'center',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '15px',
                width: '150px',
              }}
            />

            <button
              onClick={handleVerify2FA}
              disabled={loading || twoFAToken.length !== 6}
              style={{
                padding: '10px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading || twoFAToken.length !== 6 ? 'not-allowed' : 'pointer',
                opacity: loading || twoFAToken.length !== 6 ? 0.6 : 1,
              }}
            >
              {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
            </button>
          </div>
        )}

        {message && (
          <div
            style={{
              marginTop: '15px',
              padding: '10px',
              borderRadius: '4px',
              backgroundColor: message.includes('successfully') ? '#d4edda' : '#f8d7da',
              color: message.includes('successfully') ? '#155724' : '#721c24',
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
