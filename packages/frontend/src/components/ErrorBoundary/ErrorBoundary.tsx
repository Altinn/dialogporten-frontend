import React, { type ReactNode, type ErrorInfo, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { useErrorLogger } from '../../hooks/useErrorLogger';
import { PageRoutes } from '../../pages/routes';
import { useGlobalState } from '../../useGlobalState';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackUI?: ReactNode;
  componentName?: string;
  setIsErrorState: (isError: boolean) => void;
  logError: (error: Error, context?: Record<string, unknown>, errorMessage?: string) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: undefined, errorInfo: undefined };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo, error });
    this.props.setIsErrorState(true);
  }

  render() {
    const params = new URLSearchParams(window.location.search);
    const isMock = params.get('mock') === 'true' && params.get('simulateError') === 'true';

    if (isMock || (this.state.hasError && import.meta.env.PROD)) {
      const errorToReport = this.state.error || new Error('ErrorBoundary caught an error');
      const errorInfoToReport = this.state.errorInfo || {};
      this.props.logError(
        errorToReport,
        {
          ...errorInfoToReport,
          context: 'ErrorBoundary.render',
          componentName: this.props.componentName || 'Unknown Component',
        },
        'ErrorBoundary caught an error',
      );

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
  const { logError } = useErrorLogger();

  return (
    <ErrorBoundary setIsErrorState={setIsErrorState} componentName={componentName} logError={logError}>
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
