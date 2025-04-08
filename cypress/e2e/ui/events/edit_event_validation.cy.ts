// Assumes logged-in user 'eventOwner' created 'eventToEdit'
// Assumes EventForm Page Object exists

describe("[EventsTeam] Events - Validation on Edit [functional]", () => {
  let eventId: string;

  beforeEach(() => {
    // TODO: Ensure event exists, owned by eventOwner
    // cy.loginByApi("eventOwner", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit(`/events/${eventId}/edit`); // Visit event edit page
  });

  it("should show validation errors when editing an event with invalid data", () => {
    // Clear a required field (e.g., name)
    // EventFormPage.elements.eventNameInput().clear();
    cy.get('[data-testid="event-name-input"]').clear(); // Example

    // Enter invalid date range
    cy.get('[data-testid="event-end-date-input"]')
      .clear()
      .type("2023-01-01T10:00"); // Date before start

    // Attempt to submit
    cy.get('[data-testid="event-submit-button"]').click();

    // Assert validation errors are visible
    cy.contains("Event name is required").should("be.visible");
    cy.contains("End date must be after start date").should("be.visible");

    // Assert still on edit page
    cy.url().should("include", `/events/${eventId}/edit`);
  });
});
