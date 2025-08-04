// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes EventForm Page Object exists
import { generateEventData } from "../../../factories/eventData"; // Assuming an eventData factory

describe("[EventsTeam] Events - Create Invalid Event Fail [functional]", () => {
  beforeEach(() => {
    cy.loginByApi("testUserVerified");
    cy.visit("/events"); // Navigate to the event creation page
  });

  it("should show validation errors for invalid event data", () => {
    const eventData = generateEventData({
      // Example: Create invalid data
      // endDate: new Date(Date.now() - 86400000), // Removed - End date set manually below
      name: "", // Empty name
    });

    // Use EventForm Page Object
    // EventFormPage.fillForm(eventData);
    // EventFormPage.submitForm();
    cy.get("#start-date").type("2024-12-01T10:00"); // Updated selector guess
    cy.get('[data-testid="event-end-date-input"]').type("2024-11-30T11:00"); // Example invalid end date
    // Leave name empty
    cy.get('[data-testid="event-submit-button"]').click(); // Example

    // Assert validation messages are visible
    // EventFormPage.elements.nameError().should('be.visible');
    // EventFormPage.elements.endDateError().should('contain', 'End date must be after start date');
    cy.contains("Event name is required").should("be.visible"); // Example
    cy.contains("End date must be after start date").should("be.visible"); // Example

    // Assert form was not successfully submitted (e.g., still on create page)
    cy.url().should("include", "/events/create");
  });
});
