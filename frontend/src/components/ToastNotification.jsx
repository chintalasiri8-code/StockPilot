import React from 'react';
import { useAuth } from '../context/AuthContext';

const ToastNotification = () => {
  const { toasts, removeToast } = useAuth();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container-custom">
      {toasts.map((toast) => {
        let iconClass = 'bi-info-circle-fill text-info';
        let bgStyleClass = 'toast-custom-info';

        if (toast.type === 'success') {
          iconClass = 'bi-check-circle-fill text-success';
          bgStyleClass = 'toast-custom-success';
        } else if (toast.type === 'danger') {
          iconClass = 'bi-exclamation-triangle-fill text-danger';
          bgStyleClass = 'toast-custom-danger';
        }

        return (
          <div key={toast.id} className={`toast-custom ${bgStyleClass} p-3 d-flex align-items-center justify-content-between mb-2`} role="alert" aria-live="assertive" aria-atomic="true">
            <div className="d-flex align-items-center gap-3">
              <i className={`bi ${iconClass} fs-4`}></i>
              <div className="fw-medium" style={{ fontSize: '0.92rem' }}>{toast.message}</div>
            </div>
            <button type="button" className="btn-close btn-close-white ms-2" onClick={() => removeToast(toast.id)} aria-label="Close" style={{ fontSize: '0.75rem' }}></button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastNotification;
