// Assumes logged-in user 'eventCreator' created event 'popularEvent' (seeded/created)
// Assumes 'attendee1' and 'attendee2' are attending the event
// Assumes EventPage Page Object exists

describe("[EventsTeam] Events - View Attendees [functional]", () => {
  const eventName = "popularEvent";
  let eventId: string;

  beforeEach(() => {
    // TODO: Ensure event exists, eventCreator owns it, attendees are attending
    // Example: cy.createEventByApi(...).then(id => { eventId = id; cy.attendEventByApi(eventId, 'attendee1'); cy.attendEventByApi(eventId, 'attendee2'); });
    // cy.loginByApi("eventCreator", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit(`/events/${eventId}`);
  });

  it("should display the list of attendees for an event", () => {
    // Navigate to attendee list if necessary (e.g., click a link/button)
    // EventPage.elements.viewAttendeesLink().click();
    cy.get('[data-testid="view-attendees-link"]').click(); // Example

    // Assert attendee list is visible
    // cy.get('[data-testid="attendee-list"]').should('be.visible');

    // Assert known attendees are in the list
    // EventPage.elements.attendeeListItem('attendee1').should('be.visible');
    // EventPage.elements.attendeeListItem('attendee2').should('be.visible');
    cy.get('[data-testid="attendee-list-item"]')
      .contains("attendee1")
      .should("be.visible"); // Example
    cy.get('[data-testid="attendee-list-item"]')
      .contains("attendee2")
      .should("be.visible"); // Example

    // Optional: Assert attendee count
  });
});
