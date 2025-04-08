// Assumes logged-in user 'viewerUser' exists
// Assumes event 'otherUserEvent' was created by 'eventOwner'
// Assumes viewerUser is NOT eventOwner

describe("[EventsTeam] Events - Edit Other User Event Fail [functional]", () => {
  let eventId: string;

  beforeEach(() => {
    // TODO: Ensure event exists, owned by eventOwner, viewerUser is different
    // Example: cy.createEventByApi({ name: 'Other User Event', owner: 'eventOwner' }).then(id => eventId = id);
    // cy.loginByApi("viewerUser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit(`/events/${eventId}`);
  });

  it("should not show edit controls for an event created by another user", () => {
    // Assert that the "Edit Event" button/link is NOT visible
    // EventPage.elements.editEventButton().should('not.exist');
    cy.get('[data-testid="edit-event-button"]').should("not.exist"); // Example

    // Optional: Attempting direct navigation to edit URL should fail/redirect
    // cy.visit(`/events/${eventId}/edit`, { failOnStatusCode: false });
    // cy.url().should('not.include', `/events/${eventId}/edit`);
    // cy.contains('You do not have permission').should('be.visible');
  });
});
