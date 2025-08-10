describe('Booking Flow', () => {
  it('Client signs in, creates booking; Provider approves; Tracking event generated', () => {
    // Sign in as client
    cy.visit('/login');
    cy.get('input[name="email"]').type('client@example.com');
    cy.get('input[name="password"]').type('password');
    cy.get('button[type="submit"]').click();

    // Create booking for a service
    cy.visit('/services');
    cy.get('.service-card').first().click();
    cy.get('button#create-booking').click();
    cy.get('input[name="scheduled_start"]').type('2024-08-10T10:00');
    cy.get('button[type="submit"]').click();

    // Sign out
    cy.get('#logout').click();

    // Sign in as provider
    cy.visit('/login');
    cy.get('input[name="email"]').type('provider@example.com');
    cy.get('input[name="password"]').type('password');
    cy.get('button[type="submit"]').click();

    // Approve the booking
    cy.visit('/bookings');
    cy.get('.booking-item').first().within(() => {
      cy.get('button.approve').click();
    });

    // Verify tracking event
    cy.visit('/tracking-events');
    cy.contains('booking_approved');
    cy.contains('Provider approved the booking');
  });
});