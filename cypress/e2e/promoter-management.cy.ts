describe("Promoter Management", () => {
  beforeEach(() => {
    cy.clearTestData()
    cy.seedTestData()
    cy.login(Cypress.env("TEST_USER_EMAIL"), Cypress.env("TEST_USER_PASSWORD"))
  })

  afterEach(() => {
    cy.logout()
  })

  describe("Promoter List and Detail Views", () => {
    it("should display promoter list with pagination", () => {
      cy.navigateTo("/manage-promoters")
      cy.waitForPageLoad()

      // Verify promoter list is displayed
      cy.get('[data-testid="promoters-list"]').should("be.visible")
      cy.get('[data-testid="promoter-card"]').should("have.length.at.least", 1)

      // Test pagination
      cy.get('[data-testid="pagination"]').should("be.visible")
      cy.paginate("next")
      cy.get('[data-testid="promoter-card"]').should("be.visible")
    })

    it("should navigate to promoter detail page", () => {
      cy.navigateTo("/manage-promoters")

      // Click on first promoter
      cy.get('[data-testid="promoter-card"]').first().click()

      // Verify detail page
      cy.url().should("include", "/manage-promoters/")
      cy.get('[data-testid="promoter-detail"]').should("be.visible")
      cy.get('[data-testid="promoter-name"]').should("be.visible")
      cy.get('[data-testid="promoter-email"]').should("be.visible")
    })

    it("should display promoter CV data in detail view", () => {
      cy.navigateTo("/manage-promoters")
      cy.get('[data-testid="promoter-card"]').first().click()

      // Check CV sections
      cy.get('[data-testid="cv-skills"]').should("be.visible")
      cy.get('[data-testid="cv-experience"]').should("be.visible")
      cy.get('[data-testid="cv-education"]').should("be.visible")
      cy.get('[data-testid="cv-documents"]').should("be.visible")
    })

    it("should handle lazy loading of CV data", () => {
      cy.navigateTo("/manage-promoters")
      cy.get('[data-testid="promoter-card"]').first().click()

      // Verify loading state
      cy.get('[data-testid="cv-loading"]').should("be.visible")

      // Wait for data to load
      cy.get('[data-testid="cv-skills"]', { timeout: 10000 }).should("be.visible")
      cy.get('[data-testid="cv-loading"]').should("not.exist")
    })
  })

  describe("Search and Filtering", () => {
    it("should search promoters by name", () => {
      cy.navigateTo("/manage-promoters")

      // Search for a specific promoter
      cy.searchAndFilter("John Doe")

      // Verify search results
      cy.get('[data-testid="promoter-card"]').should("contain", "John Doe")
      cy.get('[data-testid="search-results-count"]').should("be.visible")
    })

    it("should filter promoters by status", () => {
      cy.navigateTo("/manage-promoters")

      // Apply status filter
      cy.searchAndFilter("", { status: "active" })

      // Verify filtered results
      cy.get('[data-testid="promoter-card"]').each(($card) => {
        cy.wrap($card).should("contain", "Active")
      })
    })

    it("should filter promoters by skills", () => {
      cy.navigateTo("/manage-promoters")

      // Apply skills filter
      cy.searchAndFilter("", { skills: "JavaScript" })

      // Verify filtered results contain the skill
      cy.get('[data-testid="promoter-skills"]').should("contain", "JavaScript")
    })

    it("should combine search and filters", () => {
      cy.navigateTo("/manage-promoters")

      // Search and filter together
      cy.searchAndFilter("John", { status: "active", skills: "React" })

      // Verify combined results
      cy.get('[data-testid="promoter-card"]').should("contain", "John")
      cy.get('[data-testid="promoter-status"]').should("contain", "Active")
    })

    it("should clear search and filters", () => {
      cy.navigateTo("/manage-promoters")

      // Apply search and filters
      cy.searchAndFilter("test", { status: "active" })

      // Clear filters
      cy.get('[data-testid="clear-filters"]').click()

      // Verify filters are cleared
      cy.get('[data-testid="search-input"]').should("have.value", "")
      cy.get('[data-testid="status-filter"]').should("have.value", "")
    })
  })

  describe("CSV Import/Export", () => {
    it("should export promoters to CSV", () => {
      cy.navigateTo("/manage-promoters")

      // Export to CSV
      cy.exportData("csv")

      // Verify download
      cy.downloadAndVerifyFile("promoters.csv")
    })

    it("should import promoters from CSV", () => {
      cy.navigateTo("/manage-promoters")

      // Click import button
      cy.get('[data-testid="import-button"]').click()

      // Upload CSV file
      cy.importData("test-promoters.csv")

      // Verify import success
      cy.verifySuccess("Promoters imported successfully")
      cy.get('[data-testid="import-summary"]').should("be.visible")
    })

    it("should validate CSV format during import", () => {
      cy.navigateTo("/manage-promoters")
      cy.get('[data-testid="import-button"]').click()

      // Upload invalid CSV
      cy.uploadFile('[data-testid="import-file-input"]', "invalid-promoters.csv")
      cy.get('[data-testid="import-button"]').click()

      // Verify validation errors
      cy.verifyError("Invalid CSV format")
      cy.get('[data-testid="validation-errors"]').should("be.visible")
    })

    it("should handle duplicate emails during import", () => {
      cy.navigateTo("/manage-promoters")
      cy.get('[data-testid="import-button"]').click()

      // Upload CSV with duplicate emails
      cy.importData("duplicate-promoters.csv")

      // Verify duplicate handling
      cy.get('[data-testid="duplicate-errors"]').should("be.visible")
      cy.get('[data-testid="import-summary"]').should("contain", "duplicates found")
    })

    it("should show import progress", () => {
      cy.navigateTo("/manage-promoters")
      cy.get('[data-testid="import-button"]').click()

      // Upload large CSV
      cy.importData("large-promoters.csv")

      // Verify progress indicator
      cy.get('[data-testid="import-progress"]').should("be.visible")
      cy.get('[data-testid="import-progress"]').should("contain", "100%")
    })
  })

  describe("Promoter Form Validation", () => {
    it("should create new promoter with valid data", () => {
      cy.navigateTo("/manage-promoters")
      cy.get('[data-testid="add-promoter-button"]').click()

      const newPromoter = {
        firstName: "New",
        lastName: "Promoter",
        email: `new.promoter.${Date.now()}@example.com`,
        phone: "+1234567890",
        nationality: "US",
      }

      cy.fillForm(newPromoter)
      cy.submitForm()

      cy.verifySuccess("Promoter created successfully")
      cy.url().should("include", "/manage-promoters/")
    })

    it("should validate required fields", () => {
      cy.navigateTo("/manage-promoters")
      cy.get('[data-testid="add-promoter-button"]').click()

      // Submit empty form
      cy.submitForm()

      // Verify validation errors
      cy.get('[data-testid="firstName-error"]').should("be.visible")
      cy.get('[data-testid="lastName-error"]').should("be.visible")
      cy.get('[data-testid="email-error"]').should("be.visible")
    })

    it("should validate email format", () => {
      cy.navigateTo("/manage-promoters")
      cy.get('[data-testid="add-promoter-button"]').click()

      cy.fillForm({
        firstName: "Test",
        lastName: "User",
        email: "invalid-email",
        phone: "+1234567890",
        nationality: "US",
      })

      cy.submitForm()

      cy.get('[data-testid="email-error"]').should("contain", "Invalid email format")
    })

    it("should validate phone number format", () => {
      cy.navigateTo("/manage-promoters")
      cy.get('[data-testid="add-promoter-button"]').click()

      cy.fillForm({
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        phone: "invalid-phone",
        nationality: "US",
      })

      cy.submitForm()

      cy.get('[data-testid="phone-error"]').should("contain", "Invalid phone number")
    })

    it("should handle duplicate email during creation", () => {
      cy.navigateTo("/manage-promoters")
      cy.get('[data-testid="add-promoter-button"]').click()

      cy.fillForm({
        firstName: "Duplicate",
        lastName: "User",
        email: Cypress.env("TEST_USER_EMAIL"),
        phone: "+1234567890",
        nationality: "US",
      })

      cy.submitForm()

      cy.verifyError("Email already exists")
    })
  })

  describe("Promoter Editing", () => {
    it("should edit promoter information", () => {
      cy.navigateTo("/manage-promoters")
      cy.get('[data-testid="promoter-card"]').first().click()
      cy.get('[data-testid="edit-promoter-button"]').click()

      // Update promoter data
      cy.fillForm({
        firstName: "Updated",
        lastName: "Name",
        phone: "+0987654321",
      })

      cy.submitForm()

      cy.verifySuccess("Promoter updated successfully")
      cy.get('[data-testid="promoter-name"]').should("contain", "Updated Name")
    })

    it("should add skills to promoter", () => {
      cy.navigateTo("/manage-promoters")
      cy.get('[data-testid="promoter-card"]').first().click()
      cy.get('[data-testid="add-skill-button"]').click()

      cy.fillForm({
        skillName: "TypeScript",
        proficiency: "Advanced",
        yearsExperience: "3",
      })

      cy.submitForm()

      cy.verifySuccess("Skill added successfully")
      cy.get('[data-testid="cv-skills"]').should("contain", "TypeScript")
    })

    it("should add experience to promoter", () => {
      cy.navigateTo("/manage-promoters")
      cy.get('[data-testid="promoter-card"]').first().click()
      cy.get('[data-testid="add-experience-button"]').click()

      cy.fillForm({
        company: "Tech Corp",
        position: "Senior Developer",
        startDate: "2020-01-01",
        endDate: "2023-01-01",
        description: "Led development team",
      })

      cy.submitForm()

      cy.verifySuccess("Experience added successfully")
      cy.get('[data-testid="cv-experience"]').should("contain", "Tech Corp")
    })
  })

  describe("Bulk Operations", () => {
    it("should perform bulk status update", () => {
      cy.navigateTo("/manage-promoters")

      // Select multiple promoters
      cy.bulkAction("status", [1, 2, 3])

      // Verify bulk action
      cy.verifySuccess("Status updated for 3 promoters")
    })

    it("should perform bulk deletion", () => {
      cy.navigateTo("/manage-promoters")

      // Select promoters for deletion
      cy.bulkAction("delete", [1, 2])

      // Confirm deletion
      cy.get('[data-testid="confirm-delete"]').click()

      cy.verifySuccess("2 promoters deleted successfully")
    })

    it("should export selected promoters", () => {
      cy.navigateTo("/manage-promoters")

      // Select promoters
      cy.get('[data-testid="select-item-1"]').check()
      cy.get('[data-testid="select-item-2"]').check()

      // Export selected
      cy.get('[data-testid="export-selected"]').click()

      // Verify export
      cy.downloadAndVerifyFile("selected-promoters.csv")
    })
  })

  describe("Analytics and Performance", () => {
    it("should display promoter analytics", () => {
      cy.navigateTo("/manage-promoters")

      // Check analytics section
      cy.get('[data-testid="promoter-analytics"]').should("be.visible")
      cy.get('[data-testid="total-promoters"]').should("be.visible")
      cy.get('[data-testid="active-promoters"]').should("be.visible")
      cy.get('[data-testid="average-rating"]').should("be.visible")
    })

    it("should display performance metrics", () => {
      cy.navigateTo("/manage-promoters")
      cy.get('[data-testid="promoter-card"]').first().click()

      // Check performance metrics
      cy.get('[data-testid="performance-metrics"]').should("be.visible")
      cy.get('[data-testid="total-contracts"]').should("be.visible")
      cy.get('[data-testid="success-rate"]').should("be.visible")
      cy.get('[data-testid="average-rating"]').should("be.visible")
    })

    it("should handle large datasets efficiently", () => {
      cy.navigateTo("/manage-promoters")

      // Verify pagination works with large datasets
      cy.get('[data-testid="pagination"]').should("be.visible")

      // Test page navigation
      cy.paginate("next")
      cy.get('[data-testid="promoter-card"]').should("be.visible")

      cy.paginate("prev")
      cy.get('[data-testid="promoter-card"]').should("be.visible")
    })
  })

  describe("Error Handling", () => {
    it("should handle network errors gracefully", () => {
      // Mock network error
      cy.intercept("GET", "/api/promoters*", { forceNetworkError: true })

      cy.navigateTo("/manage-promoters")

      cy.verifyError("Network error")
      cy.get('[data-testid="retry-button"]').should("be.visible")
    })

    it("should handle server errors", () => {
      // Mock server error
      cy.intercept("GET", "/api/promoters*", {
        statusCode: 500,
        body: { error: "Internal server error" },
      })

      cy.navigateTo("/manage-promoters")

      cy.verifyError("Server error")
    })

    it("should handle empty results", () => {
      // Mock empty results
      cy.intercept("GET", "/api/promoters*", {
        statusCode: 200,
        body: { data: [], total: 0 },
      })

      cy.navigateTo("/manage-promoters")

      cy.get('[data-testid="empty-state"]').should("be.visible")
      cy.get('[data-testid="no-promoters-message"]').should("contain", "No promoters found")
    })
  })

  describe("Access Control", () => {
    it("should enforce RLS policies", () => {
      // Login as regular user
      cy.login(Cypress.env("TEST_USER_EMAIL"), Cypress.env("TEST_USER_PASSWORD"))

      cy.navigateTo("/manage-promoters")

      // Should only see own promoters
      cy.verifyRLS("promoter", true)
    })

    it("should allow admin to see all promoters", () => {
      // Login as admin
      cy.login(Cypress.env("ADMIN_USER_EMAIL"), Cypress.env("ADMIN_USER_PASSWORD"))

      cy.navigateTo("/manage-promoters")

      // Should see all promoters
      cy.get('[data-testid="promoter-card"]').should("have.length.at.least", 1)
    })

    it("should prevent unauthorized access to promoter details", () => {
      // Try to access promoter detail directly
      cy.visit("/manage-promoters/999")

      cy.get('[data-testid="access-denied"]').should("be.visible")
    })
  })
})
