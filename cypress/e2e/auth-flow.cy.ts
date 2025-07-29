describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.clearTestData();
    cy.seedTestData();
  });

  afterEach(() => {
    cy.logout();
  });

  describe('Login/Logout Flow', () => {
    it('should successfully login with valid credentials', () => {
      cy.visit('/auth/login');
      cy.waitForPageLoad();

      // Fill login form
      cy.fillForm({
        email: Cypress.env('TEST_USER_EMAIL'),
        password: Cypress.env('TEST_USER_PASSWORD'),
      });

      cy.submitForm();

      // Verify successful login
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-menu"]').should('be.visible');
      cy.get('[data-testid="welcome-message"]').should('contain', 'Welcome');
      cy.verifySuccess('Login successful');
    });

    it('should handle invalid login credentials', () => {
      cy.visit('/auth/login');
      cy.waitForPageLoad();

      // Fill login form with invalid credentials
      cy.fillForm({
        email: 'invalid@example.com',
        password: 'wrongpassword',
      });

      cy.submitForm();

      // Verify error message
      cy.verifyError('Invalid email or password');
      cy.url().should('include', '/auth/login');
    });

    it('should handle empty form submission', () => {
      cy.visit('/auth/login');
      cy.waitForPageLoad();

      // Submit empty form
      cy.get('[data-testid="login-button"]').click();

      // Verify validation errors
      cy.get('[data-testid="email-error"]').should('be.visible');
      cy.get('[data-testid="password-error"]').should('be.visible');
    });

    it('should handle malformed email input', () => {
      cy.visit('/auth/login');
      cy.waitForPageLoad();

      // Fill form with malformed email
      cy.fillForm({
        email: 'invalid-email',
        password: 'password123',
      });

      cy.submitForm();

      // Verify validation error
      cy.get('[data-testid="email-error"]').should('contain', 'Invalid email format');
    });

    it('should successfully logout', () => {
      // Login first
      cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));

      // Perform logout
      cy.logout();

      // Verify logout
      cy.url().should('include', '/auth/login');
      cy.get('[data-testid="user-menu"]').should('not.exist');
      cy.verifySuccess('Logout successful');
    });

    it('should redirect to login when accessing protected routes', () => {
      // Try to access protected route without login
      cy.visit('/dashboard');
      cy.url().should('include', '/auth/login');
      cy.get('[data-testid="login-redirect-message"]').should('be.visible');
    });
  });

  describe('Session Management', () => {
    it('should maintain session across page refreshes', () => {
      cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));

      // Refresh page
      cy.reload();
      cy.waitForPageLoad();

      // Verify session is maintained
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-menu"]').should('be.visible');
    });

    it('should handle session expiry gracefully', () => {
      cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));

      // Simulate session expiry by clearing localStorage
      cy.window().then((win) => {
        win.localStorage.clear();
      });

      // Try to access protected route
      cy.visit('/dashboard');
      cy.url().should('include', '/auth/login');
      cy.get('[data-testid="session-expired-message"]').should('be.visible');
    });

    it('should auto-refresh token when needed', () => {
      cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));

      // Wait for token refresh (if implemented)
      cy.wait(1000);

      // Verify user is still logged in
      cy.get('[data-testid="user-menu"]').should('be.visible');
    });
  });

  describe('Password Reset Flow', () => {
    it('should initiate password reset process', () => {
      cy.visit('/auth/login');
      cy.get('[data-testid="forgot-password-link"]').click();

      cy.url().should('include', '/auth/reset-password');

      // Fill reset form
      cy.fillForm({
        email: Cypress.env('TEST_USER_EMAIL'),
      });

      cy.submitForm();

      // Verify reset email sent
      cy.verifySuccess('Password reset email sent');
    });

    it('should handle password reset with invalid email', () => {
      cy.visit('/auth/reset-password');

      cy.fillForm({
        email: 'nonexistent@example.com',
      });

      cy.submitForm();

      // Should still show success to prevent email enumeration
      cy.verifySuccess('Password reset email sent');
    });

    it('should complete password reset with valid token', () => {
      // This would require a valid reset token from the database
      cy.visit('/auth/reset-password/valid-token');

      cy.fillForm({
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      });

      cy.submitForm();

      cy.verifySuccess('Password reset successful');
      cy.url().should('include', '/auth/login');
    });

    it('should handle password reset with invalid token', () => {
      cy.visit('/auth/reset-password/invalid-token');

      cy.verifyError('Invalid or expired reset token');
    });

    it('should validate password strength during reset', () => {
      cy.visit('/auth/reset-password/valid-token');

      // Try weak password
      cy.fillForm({
        password: 'weak',
        confirmPassword: 'weak',
      });

      cy.submitForm();

      cy.get('[data-testid="password-error"]').should('contain', 'Password too weak');
    });
  });

  describe('Registration Flow', () => {
    it('should successfully register new user', () => {
      cy.visit('/auth/register');

      const newUserEmail = `newuser.${Date.now()}@example.com`;

      cy.fillForm({
        firstName: 'New',
        lastName: 'User',
        email: newUserEmail,
        password: 'StrongPassword123!',
        confirmPassword: 'StrongPassword123!',
      });

      cy.submitForm();

      cy.verifySuccess('Registration successful');
      cy.url().should('include', '/dashboard');
    });

    it('should handle duplicate email registration', () => {
      cy.visit('/auth/register');

      cy.fillForm({
        firstName: 'Duplicate',
        lastName: 'User',
        email: Cypress.env('TEST_USER_EMAIL'),
        password: 'StrongPassword123!',
        confirmPassword: 'StrongPassword123!',
      });

      cy.submitForm();

      cy.verifyError('Email already registered');
    });

    it('should validate password confirmation', () => {
      cy.visit('/auth/register');

      cy.fillForm({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'StrongPassword123!',
        confirmPassword: 'DifferentPassword123!',
      });

      cy.submitForm();

      cy.get('[data-testid="confirm-password-error"]').should('contain', 'Passwords do not match');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during login', () => {
      // Mock network error
      cy.intercept('POST', '/api/auth/login', { forceNetworkError: true });

      cy.visit('/auth/login');
      cy.fillForm({
        email: Cypress.env('TEST_USER_EMAIL'),
        password: Cypress.env('TEST_USER_PASSWORD'),
      });

      cy.submitForm();

      cy.verifyError('Network error');
    });

    it('should handle server errors gracefully', () => {
      // Mock server error
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 500,
        body: { error: 'Internal server error' },
      });

      cy.visit('/auth/login');
      cy.fillForm({
        email: Cypress.env('TEST_USER_EMAIL'),
        password: Cypress.env('TEST_USER_PASSWORD'),
      });

      cy.submitForm();

      cy.verifyError('Server error');
    });

    it('should handle rate limiting', () => {
      // Mock rate limit error
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 429,
        body: { error: 'Too many requests' },
      });

      cy.visit('/auth/login');
      cy.fillForm({
        email: Cypress.env('TEST_USER_EMAIL'),
        password: Cypress.env('TEST_USER_PASSWORD'),
      });

      cy.submitForm();

      cy.verifyError('Too many login attempts');
    });
  });

  describe('Access Control', () => {
    it('should enforce role-based access control', () => {
      // Login as regular user
      cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));

      // Try to access admin-only route
      cy.visit('/admin/users');
      cy.get('[data-testid="access-denied"]').should('be.visible');
    });

    it('should allow admin access to protected routes', () => {
      // Login as admin
      cy.login(Cypress.env('ADMIN_USER_EMAIL'), Cypress.env('ADMIN_USER_PASSWORD'));

      // Access admin route
      cy.visit('/admin/users');
      cy.get('[data-testid="admin-users-list"]').should('be.visible');
    });

    it('should redirect based on user role', () => {
      // Login as regular user
      cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));

      // Should be redirected to dashboard, not admin panel
      cy.url().should('include', '/dashboard');
      cy.url().should('not.include', '/admin');
    });
  });

  describe('Security Features', () => {
    it('should prevent XSS attacks in login form', () => {
      cy.visit('/auth/login');

      const xssPayload = '<script>alert("xss")</script>';

      cy.get('[data-testid="email-input"]').type(xssPayload);
      cy.get('[data-testid="password-input"]').type('password');

      // Verify XSS payload is not executed
      cy.window().then((win) => {
        expect(win.alert).to.not.be.called;
      });
    });

    it('should prevent SQL injection attempts', () => {
      cy.visit('/auth/login');

      const sqlInjectionPayload = "'; DROP TABLE users; --";

      cy.fillForm({
        email: sqlInjectionPayload,
        password: 'password',
      });

      cy.submitForm();

      // Should handle gracefully without exposing database errors
      cy.verifyError('Invalid email or password');
    });

    it('should enforce password complexity requirements', () => {
      cy.visit('/auth/register');

      // Try weak password
      cy.fillForm({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'weak',
        confirmPassword: 'weak',
      });

      cy.submitForm();

      cy.get('[data-testid="password-error"]').should('contain', 'Password must be at least 8 characters');
    });
  });
});