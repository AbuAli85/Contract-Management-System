// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command for login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/auth/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  cy.url().should('include', '/dashboard');
  cy.get('[data-testid="user-menu"]').should('be.visible');
});

// Custom command for logout
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/auth/login');
});

// Custom command to create a test promoter
Cypress.Commands.add('createTestPromoter', () => {
  const testPromoter = {
    first_name: 'Test',
    last_name: 'Promoter',
    email: `test.promoter.${Date.now()}@example.com`,
    phone: '+1234567890',
    nationality: 'US',
  };

  cy.request({
    method: 'POST',
    url: '/api/promoters',
    body: testPromoter,
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((response) => {
    expect(response.status).to.eq(201);
    return response.body;
  });
});

// Custom command to create a test contract
Cypress.Commands.add('createTestContract', () => {
  const testContract = {
    title: 'Test Contract',
    description: 'Test contract description',
    contract_type: 'service',
    status: 'draft',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  cy.request({
    method: 'POST',
    url: '/api/contracts',
    body: testContract,
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((response) => {
    expect(response.status).to.eq(201);
    return response.body;
  });
});

// Custom command to wait for page load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-testid="loading-spinner"]', { timeout: 10000 }).should('not.exist');
  cy.get('body').should('not.contain', 'Loading...');
});

// Custom command to check if element is ready
Cypress.Commands.add('checkElementReady', (selector: string) => {
  cy.get(selector).should('be.visible');
  cy.get(selector).should('not.be.disabled');
  cy.get(selector).should('not.have.class', 'loading');
});

// Custom command to upload file
Cypress.Commands.add('uploadFile', (selector: string, fileName: string) => {
  cy.fixture(fileName).then((fileContent) => {
    cy.get(selector).attachFile({
      fileContent: fileContent,
      fileName: fileName,
      mimeType: 'text/csv',
    });
  });
});

// Custom command to download and verify file
Cypress.Commands.add('downloadAndVerifyFile', (fileName: string) => {
  cy.readFile(`cypress/downloads/${fileName}`).should('exist');
  cy.readFile(`cypress/downloads/${fileName}`).should('contain', 'first_name,last_name,email');
});

// Override visit command to handle authentication
Cypress.Commands.overwrite('visit', (originalFn, url, options) => {
  // Add authentication headers if user is logged in
  const token = localStorage.getItem('supabase.auth.token');
  if (token) {
    options = {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${token}`,
      },
    };
  }
  return originalFn(url, options);
});

// Custom command to clear test data
Cypress.Commands.add('clearTestData', () => {
  cy.request({
    method: 'DELETE',
    url: '/api/test/clear-data',
    headers: {
      'Content-Type': 'application/json',
    },
  });
});

// Custom command to seed test data
Cypress.Commands.add('seedTestData', () => {
  cy.request({
    method: 'POST',
    url: '/api/test/seed-data',
    headers: {
      'Content-Type': 'application/json',
    },
  });
});

// Custom command to wait for network requests to complete
Cypress.Commands.add('waitForNetworkIdle', (timeout = 5000) => {
  cy.wait(timeout);
});

// Custom command to check for error messages
Cypress.Commands.add('checkForErrors', () => {
  cy.get('[data-testid="error-message"]').should('not.exist');
  cy.get('.error').should('not.exist');
  cy.get('.alert-error').should('not.exist');
});

// Custom command to fill form fields
Cypress.Commands.add('fillForm', (formData: Record<string, string>) => {
  Object.entries(formData).forEach(([field, value]) => {
    cy.get(`[data-testid="${field}-input"]`).clear().type(value);
  });
});

// Custom command to submit form
Cypress.Commands.add('submitForm', () => {
  cy.get('[data-testid="submit-button"]').click();
  cy.waitForNetworkIdle();
});

// Custom command to verify success message
Cypress.Commands.add('verifySuccess', (message?: string) => {
  if (message) {
    cy.get('[data-testid="success-message"]').should('contain', message);
  } else {
    cy.get('[data-testid="success-message"]').should('be.visible');
  }
});

// Custom command to verify error message
Cypress.Commands.add('verifyError', (message?: string) => {
  if (message) {
    cy.get('[data-testid="error-message"]').should('contain', message);
  } else {
    cy.get('[data-testid="error-message"]').should('be.visible');
  }
});

// Custom command to navigate to page
Cypress.Commands.add('navigateTo', (page: string) => {
  cy.visit(page);
  cy.waitForPageLoad();
});

// Custom command to check table data
Cypress.Commands.add('checkTableData', (expectedData: any[]) => {
  expectedData.forEach((row, index) => {
    Object.entries(row).forEach(([key, value]) => {
      cy.get(`[data-testid="table-row-${index}"]`).should('contain', value);
    });
  });
});

// Custom command to search and filter
Cypress.Commands.add('searchAndFilter', (searchTerm: string, filters?: Record<string, string>) => {
  if (searchTerm) {
    cy.get('[data-testid="search-input"]').clear().type(searchTerm);
  }
  
  if (filters) {
    Object.entries(filters).forEach(([filter, value]) => {
      cy.get(`[data-testid="${filter}-filter"]`).select(value);
    });
  }
  
  cy.get('[data-testid="search-button"]').click();
  cy.waitForNetworkIdle();
});

// Custom command to paginate
Cypress.Commands.add('paginate', (direction: 'next' | 'prev' | 'first' | 'last', pageNumber?: number) => {
  if (pageNumber) {
    cy.get(`[data-testid="page-${pageNumber}"]`).click();
  } else {
    cy.get(`[data-testid="${direction}-page"]`).click();
  }
  cy.waitForNetworkIdle();
});

// Custom command to sort table
Cypress.Commands.add('sortTable', (column: string, direction: 'asc' | 'desc' = 'asc') => {
  cy.get(`[data-testid="sort-${column}"]`).click();
  if (direction === 'desc') {
    cy.get(`[data-testid="sort-${column}"]`).click(); // Click again for desc
  }
  cy.waitForNetworkIdle();
});

// Custom command to export data
Cypress.Commands.add('exportData', (format: 'csv' | 'excel' | 'pdf') => {
  cy.get(`[data-testid="export-${format}"]`).click();
  cy.waitForNetworkIdle();
});

// Custom command to import data
Cypress.Commands.add('importData', (fileName: string) => {
  cy.uploadFile('[data-testid="import-file-input"]', fileName);
  cy.get('[data-testid="import-button"]').click();
  cy.waitForNetworkIdle();
});

// Custom command to bulk actions
Cypress.Commands.add('bulkAction', (action: string, items: number[]) => {
  items.forEach((item) => {
    cy.get(`[data-testid="select-item-${item}"]`).check();
  });
  cy.get(`[data-testid="bulk-${action}"]`).click();
  cy.get('[data-testid="confirm-action"]').click();
  cy.waitForNetworkIdle();
});

// Custom command to check permissions
Cypress.Commands.add('checkPermissions', (permissions: string[]) => {
  permissions.forEach((permission) => {
    cy.get(`[data-testid="permission-${permission}"]`).should('be.visible');
  });
});

// Custom command to verify RLS enforcement
Cypress.Commands.add('verifyRLS', (resourceType: string, shouldHaveAccess: boolean) => {
  if (shouldHaveAccess) {
    cy.get(`[data-testid="${resourceType}-list"]`).should('be.visible');
  } else {
    cy.get(`[data-testid="${resourceType}-list"]`).should('not.exist');
    cy.get('[data-testid="access-denied"]').should('be.visible');
  }
});