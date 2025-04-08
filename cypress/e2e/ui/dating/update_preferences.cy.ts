// Assumes logged-in user with dating profile
// Assumes DatingPreferencesPage exists

describe.skip("[SocialTeam] Dating - Update Preferences [functional]", () => {
  beforeEach(() => {
    // cy.loginByApi("datingUser", Cypress.env("password"));
    cy.visit("/dating/preferences"); // Assuming route exists
    cy.intercept("PUT", "/api/dating/preferences").as("updateDatingPrefs");
  });

  it("should allow user to update dating preferences (e.g., age range)", () => {
    const newMinAge = 25;
    const newMaxAge = 35;

    // Update age range sliders/inputs
    cy.get('[data-testid="min-age-slider"]')
      .invoke("val", newMinAge)
      .trigger("change");
    cy.get('[data-testid="max-age-slider"]')
      .invoke("val", newMaxAge)
      .trigger("change");

    // Update distance preference
    cy.get('[data-testid="distance-preference"]').select("50 miles"); // Example

    // Save changes
    cy.get('[data-testid="save-dating-prefs"]').click();

    cy.wait("@updateDatingPrefs");
    cy.contains("Preferences updated").should("be.visible");

    // Re-visit and verify changes persisted
    cy.visit("/dating/preferences");
    cy.get('[data-testid="min-age-slider"]').should(
      "have.value",
      newMinAge.toString(),
    );
    cy.get('[data-testid="max-age-slider"]').should(
      "have.value",
      newMaxAge.toString(),
    );
    cy.get('[data-testid="distance-preference"]').should(
      "have.value",
      "50 miles",
    );
  });
});
