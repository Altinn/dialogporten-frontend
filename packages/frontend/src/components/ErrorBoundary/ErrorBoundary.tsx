import React, { type ReactNode, type ErrorInfo, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { PageRoutes } from '../../pages/routes';
import { useGlobalState } from '../../useGlobalState';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackUI?: ReactNode;
  componentName?: string;
  setIsErrorState: (isError: boolean) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Caught by ErrorBoundary:', error, errorInfo);
    this.props.setIsErrorState(true);
  }

  render() {
    const params = new URLSearchParams(window.location.search);
    const isMock = params.get('mock') === 'true' && params.get('simulateError') === 'true';

    if (isMock || (this.state.hasError && process.env.NODE_ENV)) {
      return (
        <Navigate
          to={PageRoutes.error}
          replace
          state={{
            componentName: this.props.componentName || 'Unknown Component',
          }}
        />
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

export const withErrorBoundary = (Component: React.ReactNode, componentName: string) => {
  return <ErrorBoundaryWrapper componentName={componentName}>{Component}</ErrorBoundaryWrapper>;
};

function ErrorBoundaryWrapper({
  children,
  componentName,
}: {
  children: React.ReactNode;
  componentName: string;
}) {
  const [, setIsErrorState] = useGlobalState<boolean>(QUERY_KEYS.ERROR_STATE, false);

  return (
    <ErrorBoundary setIsErrorState={setIsErrorState} componentName={componentName}>
      {children}
    </ErrorBoundary>
  );
}

export const ErrorResetHandler = () => {
  const location = useLocation();
  const [isError, setIsErrorState] = useGlobalState<boolean>(QUERY_KEYS.ERROR_STATE, false);

  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    const prevPath = prevPathRef.current;
    const isOnErrorPage = location.pathname === '/error';
    const wasOnErrorPage = prevPath === '/error';

    if (isError && wasOnErrorPage && !isOnErrorPage) {
      setIsErrorState(false);
    }

    if (isOnErrorPage && !isError) {
      setIsErrorState(true);
    }

    prevPathRef.current = location.pathname;
  }, [location, isError, setIsErrorState]);

  return null;
};
