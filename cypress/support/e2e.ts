// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add custom commands for authentication
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login with email and password
       * @example cy.login('user@example.com', 'password')
       */
      login(email: string, password: string): Chainable<void>;

      /**
       * Custom command to logout
       * @example cy.logout()
       */
      logout(): Chainable<void>;

      /**
       * Custom command to create a test promoter
       * @example cy.createTestPromoter()
       */
      createTestPromoter(): Chainable<any>;

      /**
       * Custom command to create a test contract
       * @example cy.createTestContract()
       */
      createTestContract(): Chainable<any>;

      /**
       * Custom command to wait for page load
       * @example cy.waitForPageLoad()
       */
      waitForPageLoad(): Chainable<void>;

      /**
       * Custom command to check if element is visible and clickable
       * @example cy.checkElementReady('[data-testid="submit-button"]')
       */
      checkElementReady(selector: string): Chainable<void>;

      /**
       * Custom command to upload file
       * @example cy.uploadFile('[data-testid="file-input"]', 'test-file.csv')
       */
      uploadFile(selector: string, fileName: string): Chainable<void>;

      /**
       * Custom command to download and verify file
       * @example cy.downloadAndVerifyFile('promoters.csv')
       */
      downloadAndVerifyFile(fileName: string): Chainable<void>;
    }
  }
}

// Prevent TypeScript from reading file as legacy script
export {};
