import { createContext, useContext, useReducer } from 'react';

// Simple ID generator for toasts
function genId() {
  return Math.random().toString(36).substr(2, 9);
}

// Reducer to manage toast state
export const reducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, { id: genId(), ...action.toast }],
      };
    case 'DISMISS_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.id),
      };
    default:
      return state;
  }
};

// Create context
const ToastContext = createContext({
  toasts: [],
  toast: () => {},
  dismissToast: () => {},
});

// Provider component
export function ToastProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { toasts: [] });

  // Function to dismiss a toast
  function dismissToast(id) {
    dispatch({ type: 'DISMISS_TOAST', id });
  }

  // Function to create a toast
  function toast({ ...props }) {
    // Set default variant if not provided
    const toast = {
      ...props,
      variant: props.variant || 'default',
      duration: props.duration || 5000
    };
    
    dispatch({ type: 'ADD_TOAST', toast });
  }

  return (
    <ToastContext.Provider
      value={{
        toasts: state.toasts,
        toast,
        dismissToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

// Hook to use toast
function useToast() {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
}

export { useToast };