import { useCallback, useState } from 'react';

function useToast(defaultSeverity = 'success') {
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: defaultSeverity
  });

  const showToast = useCallback((message, severity = defaultSeverity) => {
    setToast({ open: true, message, severity });
  }, [defaultSeverity]);

  const closeToast = useCallback((_, reason) => {
    if (reason === 'clickaway') return;
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  return { toast, showToast, closeToast };
}

export default useToast;
