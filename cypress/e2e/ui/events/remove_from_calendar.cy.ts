// Assumes logged-in user 'testuser' (use cy.loginByApi in beforeEach)
// Assumes user is attending event 'attendedEvent' (seeded/created)
// Assumes EventPage Page Object exists

describe("[EventsTeam] Events - Remove From Calendar [functional]", () => {
  const eventName = "attendedEvent";
  let eventId: string;

  beforeEach(() => {
    // TODO: Ensure event exists and testuser is attending
    // Example: cy.createEventByApi({ name: eventName }).then(id => { eventId = id; cy.attendEventByApi(eventId); });
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit(`/events/${eventId}`); // Visit the event details page

    // Intercept the remove/unattend API (assuming DELETE)
    cy.intercept("DELETE", `/api/events/${eventId}/attendees`).as(
      "removeAttendee",
    );
  });

  it("should allow user to remove an attended event from their calendar via event page", () => {
    // Find and click the "Remove from Calendar" or "Not Attending" button
    // EventPage.elements.removeAttendanceButton().click();
    cy.get('[data-testid="remove-attendance-button"]').click(); // Example

    // Confirm removal if necessary
    // cy.get('[data-testid="confirm-removal"]').click();

    // Wait for API call
    cy.wait("@removeAttendee");

    // Assert button state changes back to "Add to Calendar" or similar
    // EventPage.elements.addAttendanceButton().should('be.visible');
    cy.get('[data-testid="add-attendance-button"]').should("be.visible"); // Example

    // Optional: Navigate to calendar page and verify event is not marked as attending
  });
});
