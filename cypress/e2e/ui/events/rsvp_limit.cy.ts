// Assumes event 'limitedEvent' exists with an attendee limit (e.g., 1)
// Assumes 'attendee1' has already filled the spot

describe("[EventsTeam] Events - RSVP Limit Reached [functional]", () => {
  let eventId: string;

  beforeEach(() => {
    // TODO: Ensure event exists with limit=1, ensure attendee1 IS attending
    // cy.loginByApi("lateUser", Cypress.env("password")); // Login as a user trying to attend late
    cy.loginViaUi();
    cy.visit(`/events/${eventId}`);
  });

  it("should show event as full or disable attendance button when limit reached", () => {
    // Option 1: Check for a "Event Full" message
    cy.contains("Event is full").should("be.visible"); // Example text

    // Option 2: Check if the Add to Calendar / Attend button is disabled or hidden
    // EventPage.elements.addAttendanceButton().should('be.disabled');
    cy.get('[data-testid="add-attendance-button"]').should("be.disabled"); // Example
    // OR
    // cy.get('[data-testid="add-attendance-button"]').should('not.exist');
  });
});
