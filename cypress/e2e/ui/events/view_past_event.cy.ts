// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes event 'pastEvent' exists with an end date in the past (seeded/created)
// Assumes EventPage Page Object exists

describe("[EventsTeam] Events - View Past Event [functional]", () => {
  let eventId: string;

  beforeEach(() => {
    // TODO: Ensure event exists with end date in the past
    // Example: cy.createEventByApi({ name: 'Past Event', endDate: '2023-01-01T12:00:00Z' }).then(id => eventId = id);
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit(`/events/${eventId}`);
  });

  it("should display indication that the event has ended", () => {
    // Assert a message like "Event Ended" is visible
    // EventPage.elements.eventEndedMessage().should('be.visible');
    cy.contains("This event has ended").should("be.visible"); // Example

    // Assert that action buttons like "Add to Calendar" are disabled or hidden
    // EventPage.elements.addAttendanceButton().should('not.exist'); // Or .be.disabled
    cy.get('[data-testid="add-attendance-button"]').should("not.exist"); // Example
  });
});
