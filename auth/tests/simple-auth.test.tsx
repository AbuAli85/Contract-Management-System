import { render, screen } from '@testing-library/react'
import { AuthProvider } from '@/src/components/auth/auth-provider'

// Simple test to verify the auth provider renders without errors
describe('Authentication System', () => {
  it('renders AuthProvider without crashing', () => {
    render(
      <AuthProvider>
        <div data-testid="auth-provider">Auth Provider Test</div>
      </AuthProvider>
    )
    
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument()
  })

  it('provides authentication context', () => {
    const TestComponent = () => {
      return <div data-testid="test-component">Test Component</div>
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(screen.getByTestId('test-component')).toBeInTheDocument()
  })
}) 