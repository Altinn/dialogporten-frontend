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

const extractComponentInfo = (componentStack: string): { componentName: string; filePath: string } => {
  // Component stack looks like: "at ComponentName (path/to/file.tsx:line:col)"
  const firstLine = componentStack.split('\n')[0]?.trim() || '';

  const componentMatch = firstLine.match(/at\s+(\w+)/);
  const componentName = componentMatch?.[1] || 'Unknown';

  const fileMatch = firstLine.match(/\((.*?):\d+:\d+\)/);
  const fullPath = fileMatch?.[1] || '';

  const relativePath = fullPath.includes('src/') ? fullPath.substring(fullPath.indexOf('src/')) : fullPath;

  return { componentName, filePath: relativePath || 'Unknown' };
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: undefined, errorInfo: undefined };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const componentStack = errorInfo?.componentStack || '';
    const { componentName, filePath } = extractComponentInfo(componentStack);

    console.error(`[ErrorBoundary] Error in ${componentName} (${filePath})\n` + `Message: ${error.message}`);

    this.setState({ errorInfo, error });
    this.props.setIsErrorState(true);
  }

  render() {
    const params = new URLSearchParams(window.location.search);
    const isMock = params.get('mock') === 'true' && params.get('simulateError') === 'true';

    if (isMock || (this.state.hasError && import.meta.env.PROD)) {
      const errorToReport = this.state.error || new Error('ErrorBoundary caught an error');
      const errorInfoToReport = this.state.errorInfo || {};
      const componentStack = errorInfoToReport?.componentStack || '';
      const { componentName: errorComponent, filePath } = extractComponentInfo(componentStack);

      this.props.logError(
        errorToReport,
        {
          ...errorInfoToReport,
          context: 'ErrorBoundary.render',
          componentName: this.props.componentName || 'Unknown Component',
          errorComponent,
          errorFilePath: filePath,
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
