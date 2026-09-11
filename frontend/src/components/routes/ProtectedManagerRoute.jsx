import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import API from '../../api/api';
import PageLoader from '../common/PageLoader';

function ProtectedManagerRoute({ children }) {
  const [status, setStatus] = useState('checking');

  const verifySession = useCallback(async () => {
    const token = localStorage.getItem('managerHubToken');
    if (!token) {
      setStatus('locked');
      return;
    }

    try {
      await API.get('/manager-hub/session', {
        headers: {
          'x-manager-hub-token': token
        }
      });
      setStatus('unlocked');
    } catch (error) {
      localStorage.removeItem('managerHubToken');
      setStatus('locked');
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  if (status === 'checking') {
    return <PageLoader message="Checking access..." minHeight="100vh" />;
  }

  if (status === 'locked') {
    return <Navigate to="/manage-hub" replace />;
  }

  return children;
}

export default ProtectedManagerRoute;
