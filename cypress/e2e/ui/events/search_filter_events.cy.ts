// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes events with specific names/dates/locations exist (seeded/created)
// Assumes EventsPage Page Object exists with search/filter controls

describe("[EventsTeam] Events - Search/Filter [functional]", () => {
  const specificEventName = "Searchable Rock Concert";
  const specificLocation = "Event City";

  beforeEach(() => {
    // TODO: Seed/create events including one matching specificEventName/Location
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/events"); // Visit the main events listing page
    // Intercept event search/list API
    cy.intercept("GET", "/api/events?*").as("getEvents");
  });

  it("should filter events by name", () => {
    // Use EventsPage Page Object
    // EventsPage.searchByName(specificEventName);
    cy.get('[data-testid="event-search-input"]').type(
      `${specificEventName}{enter}`,
    ); // Example
    cy.wait("@getEvents");

    // Assert only matching event(s) are shown
    cy.get('[data-testid="event-list-item"]').should("have.length", 1);
    cy.get('[data-testid="event-list-item"]').should(
      "contain",
      specificEventName,
    );
  });

  it("should filter events by location", () => {
    // Use EventsPage Page Object
    // EventsPage.filterByLocation(specificLocation);
    cy.get('[data-testid="event-location-filter"]').select(specificLocation); // Example select dropdown
    cy.wait("@getEvents");

    // Assert only events in that location are shown
    cy.get('[data-testid="event-list-item"]').each(($el) => {
      cy.wrap($el)
        .find('[data-testid="event-location"]')
        .should("contain", specificLocation);
    });
  });

  // Add tests for date filters, combining filters, etc.
});
