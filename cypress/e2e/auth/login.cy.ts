describe('User Login', () => {
  beforeEach(() => {
    cy.visit('/en/auth/login')
  })

  it('should display login form', () => {
    cy.get('input[name="email"]').should('be.visible')
    cy.get('input[name="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('should show validation errors for invalid inputs', () => {
    cy.get('button[type="submit"]').click()
    // Wait for validation messages
    cy.contains('required', { matchCase: false }).should('be.visible')
  })

  it('should show error for invalid email format', () => {
    cy.get('input[name="email"]').type('invalid-email')
    cy.get('input[name="password"]').type('password123')
    cy.get('button[type="submit"]').click()

    cy.contains('valid email', { matchCase: false }).should('be.visible')
  })
})

