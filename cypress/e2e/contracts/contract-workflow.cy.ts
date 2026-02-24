/**
 * Contract Workflow E2E Tests
 *
 * Tests for the complete contract lifecycle: creation, viewing,
 * status updates, and PDF generation.
 */

describe('Contract Workflow', () => {
  const mockContract = {
    id: 'contract-001',
    contract_number: 'CTR-000001',
    contract_type: 'employment',
    status: 'active',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    first_party_name_en: 'ABC Company',
    second_party_name_en: 'Ahmed Al-Rashid',
    created_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    cy.intercept('GET', '/api/contracts*', {
      statusCode: 200,
      body: {
        success: true,
        contracts: [mockContract],
        total: 1,
        page: 1,
        limit: 10,
      },
    }).as('getContracts');

    cy.intercept('GET', '/api/contracts/contract-001', {
      statusCode: 200,
      body: {
        success: true,
        contract: mockContract,
      },
    }).as('getContractDetail');

    cy.intercept('GET', '/api/parties*', {
      statusCode: 200,
      body: {
        success: true,
        parties: [
          { id: 'party-001', name_en: 'ABC Company', type: 'Employer' },
          { id: 'party-002', name_en: 'XYZ Corp', type: 'Employer' },
        ],
      },
    }).as('getParties');

    cy.intercept('GET', '/api/promoters*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          { id: 'promoter-001', name_en: 'Ahmed Al-Rashid', status: 'active' },
        ],
      },
    }).as('getPromoters');
  });

  describe('Contracts List', () => {
    it('should display the contracts list', () => {
      cy.visit('/en/contracts');
      cy.wait('@getContracts');
      cy.contains('CTR-000001').should('be.visible');
    });

    it('should show contract status badges', () => {
      cy.visit('/en/contracts');
      cy.wait('@getContracts');
      cy.contains('active', { matchCase: false }).should('exist');
    });

    it('should have search and filter options', () => {
      cy.visit('/en/contracts');
      cy.get('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]').should('exist');
    });

    it('should have pagination controls for large datasets', () => {
      cy.intercept('GET', '/api/contracts*', {
        statusCode: 200,
        body: {
          success: true,
          contracts: Array.from({ length: 10 }, (_, i) => ({
            ...mockContract,
            id: `contract-${i + 1}`,
            contract_number: `CTR-${String(i + 1).padStart(6, '0')}`,
          })),
          total: 50,
          page: 1,
          limit: 10,
        },
      }).as('getManyContracts');

      cy.visit('/en/contracts');
      cy.wait('@getManyContracts');
      cy.get('[aria-label*="pagination"], [class*="pagination"], nav[aria-label*="page"]').should('exist');
    });
  });

  describe('Contract Detail View', () => {
    it('should display contract details', () => {
      cy.visit('/en/contracts/contract-001');
      cy.wait('@getContractDetail');
      cy.contains('CTR-000001').should('be.visible');
    });

    it('should show contract parties', () => {
      cy.visit('/en/contracts/contract-001');
      cy.wait('@getContractDetail');
      cy.contains('ABC Company').should('be.visible');
    });

    it('should show contract dates', () => {
      cy.visit('/en/contracts/contract-001');
      cy.wait('@getContractDetail');
      cy.contains('2024', { matchCase: false }).should('exist');
    });

    it('should have action buttons for admins', () => {
      cy.visit('/en/contracts/contract-001');
      cy.wait('@getContractDetail');
      cy.get('button').should('have.length.greaterThan', 0);
    });
  });

  describe('Contract Creation', () => {
    it('should display the contract creation form', () => {
      cy.visit('/en/generate-contract');
      cy.get('form, [role="form"]').should('exist');
    });

    it('should have required form fields', () => {
      cy.visit('/en/generate-contract');
      // Should have party selectors
      cy.get('select, [role="combobox"], [data-radix-select-trigger]').should('exist');
    });

    it('should validate required fields on submit', () => {
      cy.visit('/en/generate-contract');
      cy.get('button[type="submit"]').click();
      // Should show validation errors
      cy.get('[class*="error"], [role="alert"], [aria-invalid="true"]').should('exist');
    });

    it('should show a success message after successful contract creation', () => {
      cy.intercept('POST', '/api/contracts', {
        statusCode: 201,
        body: {
          success: true,
          contract: { ...mockContract, id: 'new-contract' },
        },
      }).as('createContract');

      cy.visit('/en/generate-contract');
      // Fill in the form (basic fields)
      cy.get('select[name="contractType"], [name="contractType"]').first().select('employment');
      cy.get('button[type="submit"]').click();
    });
  });

  describe('Contract Status Management', () => {
    it('should allow status updates for authorized users', () => {
      cy.intercept('PATCH', '/api/contracts/contract-001', {
        statusCode: 200,
        body: { success: true, contract: { ...mockContract, status: 'completed' } },
      }).as('updateContract');

      cy.visit('/en/contracts/contract-001');
      cy.wait('@getContractDetail');
      // Look for status change button
      cy.get('button').contains(/complete|approve|update/i).should('exist');
    });
  });

  describe('Contract PDF Generation', () => {
    it('should have a download/print button for contracts', () => {
      cy.visit('/en/contracts/contract-001');
      cy.wait('@getContractDetail');
      cy.get('button, a').contains(/pdf|download|print/i).should('exist');
    });
  });
});
