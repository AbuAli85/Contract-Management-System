/**
 * Dashboard E2E Tests
 *
 * Tests for the main dashboard including stats display,
 * navigation, and role-based content visibility.
 */

describe('Dashboard', () => {
  beforeEach(() => {
    // Mock API responses
    cy.intercept('GET', '/api/metrics/contracts*', {
      statusCode: 200,
      body: {
        success: true,
        metrics: {
          total: 45,
          active: 30,
          pending: 8,
          completed: 5,
          cancelled: 2,
          previousMonth: {
            totalContracts: 40,
            activeContracts: 27,
          },
        },
        scope: 'system-wide',
      },
    }).as('getContractMetrics');

    cy.intercept('GET', '/api/promoters/enhanced-metrics*', {
      statusCode: 200,
      body: {
        success: true,
        metrics: {
          totalWorkforce: 120,
          activeOnContracts: 95,
          availableForWork: 20,
          onLeave: 5,
          inactive: 0,
          utilizationRate: 79,
          complianceRate: 92,
          previousMonth: {
            totalWorkforce: 115,
            utilizationRate: 75,
          },
        },
      },
    }).as('getPromoterMetrics');
  });

  describe('Dashboard Layout', () => {
    it('should load the dashboard without errors', () => {
      cy.visit('/en/dashboard');
      cy.get('body').should('not.contain', 'Error');
      cy.get('body').should('not.contain', '500');
    });

    it('should display the main navigation', () => {
      cy.visit('/en/dashboard');
      cy.get('nav, [role="navigation"], header').should('exist');
    });

    it('should show the Contract Management System title', () => {
      cy.visit('/en/dashboard');
      cy.contains('Contract Management', { matchCase: false }).should('be.visible');
    });
  });

  describe('Statistics Cards', () => {
    it('should display contract statistics', () => {
      cy.visit('/en/dashboard');
      cy.wait('@getContractMetrics');
      cy.contains('Contracts', { matchCase: false }).should('exist');
    });

    it('should display workforce statistics', () => {
      cy.visit('/en/dashboard');
      cy.wait('@getPromoterMetrics');
      cy.contains('Workforce', { matchCase: false }).should('exist');
    });

    it('should show loading state while fetching data', () => {
      // Delay the API response to see loading state
      cy.intercept('GET', '/api/metrics/contracts*', (req) => {
        req.reply({ delay: 500, body: { success: true, metrics: {} } });
      }).as('slowContractMetrics');

      cy.visit('/en/dashboard');
      // Loading spinner or skeleton should be visible
      cy.get('[class*="animate"], [class*="loading"], [class*="skeleton"]').should('exist');
    });
  });

  describe('Navigation Links', () => {
    it('should have a link to contracts', () => {
      cy.visit('/en/dashboard');
      cy.get('a[href*="contracts"], a[href*="contract"]').should('exist');
    });

    it('should have a link to promoters', () => {
      cy.visit('/en/dashboard');
      cy.get('a[href*="promoters"], a[href*="promoter"]').should('exist');
    });
  });

  describe('Refresh Functionality', () => {
    it('should have a refresh button', () => {
      cy.visit('/en/dashboard');
      cy.get('button[aria-label*="refresh"], button[title*="refresh"]').should('exist');
    });
  });

  describe('Responsive Design', () => {
    it('should be usable on mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.visit('/en/dashboard');
      cy.get('body').should('not.contain', 'Error');
    });

    it('should be usable on tablet viewport', () => {
      cy.viewport('ipad-2');
      cy.visit('/en/dashboard');
      cy.get('body').should('not.contain', 'Error');
    });
  });
});
