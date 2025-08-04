// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes an event 'eventWithPerformer' exists with performer 'performerUser' (seeded/created)
// Assumes EventPage Page Object exists

describe("[EventsTeam] Events - Click Performer Profile [functional]", () => {
  let eventId: string;
  const performerUsername = "performerUser";

  beforeEach(() => {
    // TODO: Seed/create event with performerUser linked
    // Example: cy.createEventByApi({ ..., performers: [performerUsername] }).then(id => eventId = id);
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.visit(`/events/${eventId}`);
  });

  it("should navigate to performer profile when clicking performer link on event page", () => {
    // Find the performer link/tag on the event details page
    // EventPage.elements.performerLink(performerUsername).click();
    cy.get('[data-testid="event-performer-link"]')
      .contains(performerUsername)
      .click(); // Example

    // Assert navigation to the performer's profile page
    cy.url().should("include", `/users/${performerUsername}`);
    cy.get('[data-testid="profile-username"]').should(
      "contain",
      performerUsername,
    );
  });
});
