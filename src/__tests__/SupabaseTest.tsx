import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const SupabaseTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Checking...');
  const [user, setUser] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      if (!supabase) {
        setStatus('❌ Supabase not initialized - check your .env.local file');
        return;
      }

      try {
        // Test basic connection
        const { data, error } = await supabase.from('setlists').select('count').limit(1);
        
        if (error) {
          setStatus(`❌ Database error: ${error.message}`);
          return;
        }

        setIsConnected(true);
        setStatus('✅ Connected to Supabase successfully!');

        // Check if user is authenticated
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);

      } catch (err) {
        setStatus(`❌ Connection failed: ${err}`);
      }
    };

    checkConnection();
  }, []);

  const handleSignUp = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'testpassword123'
      });
      
      if (error) {
        setStatus(`❌ Sign up failed: ${error.message}`);
      } else {
        setStatus('✅ Sign up successful! Check your email for verification.');
      }
    } catch (err) {
      setStatus(`❌ Sign up error: ${err}`);
    }
  };

  const handleSignIn = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword123'
      });
      
      if (error) {
        setStatus(`❌ Sign in failed: ${error.message}`);
      } else {
        setStatus('✅ Sign in successful!');
        setUser(data.user);
      }
    } catch (err) {
      setStatus(`❌ Sign in error: ${err}`);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    
    try {
      await supabase.auth.signOut();
      setStatus('✅ Signed out successfully!');
      setUser(null);
    } catch (err) {
      setStatus(`❌ Sign out error: ${err}`);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ccc', 
      margin: '20px',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>🔧 Supabase Connection Test</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Status:</strong> {status}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Connected:</strong> {isConnected ? '✅ Yes' : '❌ No'}
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>User:</strong> {user ? `✅ ${user.email}` : '❌ Not signed in'}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={handleSignUp}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Sign Up
        </button>
        
        <button 
          onClick={handleSignIn}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Sign In
        </button>
        
        <button 
          onClick={handleSignOut}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <strong>Instructions:</strong>
        <ol>
          <li>Make sure your .env.local file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</li>
          <li>Run the SQL from supabase-setup.sql in your Supabase SQL Editor</li>
          <li>Restart your dev server after adding env vars</li>
        </ol>
      </div>
    </div>
  );
};
