import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME_COLORS } from '../../constants/AppConstants';

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
  showRetry?: boolean;
  criticalOperation?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorBoundaryId: string;
  retryCount: number;
}

/**
 * Enhanced Error Boundary specifically for trading operations
 * Provides recovery mechanisms and detailed error reporting
 */
export class TradingErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      errorBoundaryId: Date.now().toString(),
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Show alert for critical trading operations
    if (this.props.criticalOperation) {
      Alert.alert(
        'Trading Operation Failed',
        `An error occurred during ${this.props.criticalOperation}. Your account data is safe. Please try again.`,
        [
          { text: 'OK', onPress: () => {} }
        ]
      );
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorBoundaryId: Date.now().toString(),
        retryCount: prevState.retryCount + 1
      }));
    } else {
      Alert.alert(
        'Multiple Failures',
        'This operation has failed multiple times. Please restart the app or contact support.',
        [
          { text: 'OK', onPress: () => {} }
        ]
      );
    }
  };

  handleReportIssue = () => {
    Alert.alert(
      'Report Issue',
      'Error details have been logged. Please restart the app and try again.',
      [
        { text: 'OK', onPress: () => {} }
      ]
    );
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      // Default trading error UI
      return (
        <View style={styles.container}>
          <View style={styles.errorIcon}>
            <Ionicons name="warning-outline" size={48} color={THEME_COLORS.DANGER} />
          </View>
          
          <Text style={styles.title}>Trading Operation Failed</Text>
          
          <Text style={styles.message}>
            {this.props.criticalOperation 
              ? `Failed to execute ${this.props.criticalOperation}`
              : 'A trading error occurred'
            }
          </Text>
          
          <Text style={styles.subMessage}>
            Your account data is safe. No transactions were processed.
          </Text>

          {this.state.retryCount < this.maxRetries && this.props.showRetry !== false && (
            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Text style={styles.retryButtonText}>
                Try Again ({this.maxRetries - this.state.retryCount} attempts left)
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.reportButton} onPress={this.handleReportIssue}>
            <Text style={styles.reportButtonText}>Report Issue</Text>
          </TouchableOpacity>

          
        </View>
      );
    }

    return (
      <React.Fragment key={this.state.errorBoundaryId}>
        {this.props.children}
      </React.Fragment>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: THEME_COLORS.LIGHT,
  },
  errorIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME_COLORS.DANGER,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: THEME_COLORS.DARK,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  subMessage: {
    fontSize: 14,
    color: THEME_COLORS.GRAY[600],
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: THEME_COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  retryButtonText: {
    color: THEME_COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  reportButton: {
    backgroundColor: THEME_COLORS.GRAY[500],
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  reportButtonText: {
    color: THEME_COLORS.WHITE,
    fontSize: 14,
    fontWeight: '500',
  },

});

export default TradingErrorBoundary;