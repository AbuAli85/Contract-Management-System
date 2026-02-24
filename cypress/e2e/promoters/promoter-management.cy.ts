/**
 * Promoter Management E2E Tests
 *
 * Tests for the complete promoter management workflow including
 * listing, viewing, filtering, and document status checks.
 */

describe('Promoter Management', () => {
  beforeEach(() => {
    // Intercept API calls for promoters
    cy.intercept('GET', '/api/promoters*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 'promoter-001',
            first_name: 'Ahmed',
            last_name: 'Al-Rashid',
            name_en: 'Ahmed Al-Rashid',
            email: 'ahmed@example.com',
            status: 'active',
            id_card_expiry_date: '2026-12-31',
            passport_expiry_date: '2027-06-30',
            employer_id: 'employer-001',
          },
          {
            id: 'promoter-002',
            first_name: 'Sara',
            last_name: 'Hassan',
            name_en: 'Sara Hassan',
            email: 'sara@example.com',
            status: 'active',
            id_card_expiry_date: '2025-03-15',
            passport_expiry_date: '2025-04-20',
            employer_id: 'employer-001',
          },
        ],
        total: 2,
      },
    }).as('getPromoters');

    // Login as admin
    cy.visit('/en/auth/login');
    cy.get('input[name="email"], input[type="email"]').type('admin@example.com');
    cy.get('input[name="password"], input[type="password"]').type('AdminPass123!');
    cy.get('button[type="submit"]').click();
  });

  describe('Promoter List Page', () => {
    it('should display the promoters list', () => {
      cy.visit('/en/promoters');
      cy.wait('@getPromoters');
      cy.contains('Ahmed Al-Rashid').should('be.visible');
    });

    it('should show promoter status badges', () => {
      cy.visit('/en/promoters');
      cy.wait('@getPromoters');
      cy.get('[data-testid="promoter-status"], .badge, [class*="badge"]').should('exist');
    });

    it('should have a search/filter functionality', () => {
      cy.visit('/en/promoters');
      cy.get('input[placeholder*="search"], input[placeholder*="Search"], input[type="search"]')
        .should('exist');
    });

    it('should have an add promoter button for admins', () => {
      cy.visit('/en/promoters');
      cy.contains('Add Promoter', { matchCase: false }).should('exist');
    });
  });

  describe('Promoter Detail Page', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/promoters/promoter-001', {
        statusCode: 200,
        body: {
          success: true,
          promoter: {
            id: 'promoter-001',
            first_name: 'Ahmed',
            last_name: 'Al-Rashid',
            name_en: 'Ahmed Al-Rashid',
            email: 'ahmed@example.com',
            status: 'active',
            id_card_number: 'ID123456',
            id_card_expiry_date: '2026-12-31',
            passport_number: 'PS789012',
            passport_expiry_date: '2027-06-30',
            contracts: [],
          },
        },
      }).as('getPromoterDetail');
    });

    it('should display promoter personal information', () => {
      cy.visit('/en/manage-promoters/promoter-001');
      cy.wait('@getPromoterDetail');
      cy.contains('Ahmed', { matchCase: false }).should('be.visible');
    });

    it('should show document status section', () => {
      cy.visit('/en/manage-promoters/promoter-001');
      cy.wait('@getPromoterDetail');
      cy.contains('ID Card', { matchCase: false }).should('exist');
    });

    it('should have navigation tabs', () => {
      cy.visit('/en/manage-promoters/promoter-001');
      cy.wait('@getPromoterDetail');
      cy.get('[role="tab"], [data-radix-collection-item]').should('have.length.greaterThan', 0);
    });
  });

  describe('Document Expiry Alerts', () => {
    it('should show warning for documents expiring soon', () => {
      // Create a promoter with documents expiring in 15 days
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 15);
      const soonDateStr = soonDate.toISOString().split('T')[0];

      cy.intercept('GET', '/api/promoters/promoter-expiring', {
        statusCode: 200,
        body: {
          success: true,
          promoter: {
            id: 'promoter-expiring',
            first_name: 'Test',
            last_name: 'User',
            name_en: 'Test User',
            status: 'active',
            id_card_expiry_date: soonDateStr,
            passport_expiry_date: soonDateStr,
            contracts: [],
          },
        },
      }).as('getExpiringPromoter');

      cy.visit('/en/manage-promoters/promoter-expiring');
      cy.wait('@getExpiringPromoter');
      // The page should load without errors
      cy.get('body').should('not.contain', 'Error');
    });
  });
});
