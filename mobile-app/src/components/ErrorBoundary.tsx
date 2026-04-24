import React, { ReactNode, Component, ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('❌ Error Boundary Caught Error:', error);
    console.error('Error Info:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            <Text style={styles.title}>⚠️ Oops! Something went wrong</Text>
            
            <View style={styles.errorBox}>
              <Text style={styles.errorLabel}>Error Message:</Text>
              <Text style={styles.errorMessage}>
                {this.state.error?.message || 'Unknown error occurred'}
              </Text>
              
              {this.state.errorInfo && (
                <>
                  <Text style={styles.errorLabel}>Stack Trace:</Text>
                  <Text style={styles.stackTrace}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                </>
              )}
            </View>
            
            <Text style={styles.suggestion}>
              Try restarting the app or contact support if the problem persists.
            </Text>
          </ScrollView>
          
          <TouchableOpacity
            style={styles.button}
            onPress={this.resetError}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'space-between',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 16,
    marginTop: 16,
    fontFamily: 'Poppins-Bold',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorLabel: {
    fontWeight: '700',
    color: '#991B1B',
    marginTop: 8,
    fontFamily: 'Poppins-Bold',
  },
  errorMessage: {
    color: '#7C2D12',
    marginTop: 4,
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  stackTrace: {
    color: '#7C2D12',
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'Poppins-Light',
  },
  suggestion: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    fontFamily: 'Poppins',
  },
  button: {
    backgroundColor: '#6366F1',
    padding: 14,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});
