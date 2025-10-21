export interface BaseErrorProps {
  message?: string;
  onRetry?: () => void;
  onCancel?: () => void;
  showRetry?: boolean;
}

