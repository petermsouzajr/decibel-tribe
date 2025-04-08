// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes posts exist with the hashtag #TestHashtag (seeded/created)
// Assumes SearchPage Page Object exists

describe("[SocialTeam] Search - Hashtag [functional]", () => {
  const targetHashtag = "#TestHashtag";
  const hashtagQuery = "TestHashtag"; // Search usually omits the #

  beforeEach(() => {
    // TODO: Create posts containing the targetHashtag
    // Example: cy.createPostByApi({ content: `Post with ${targetHashtag}` });
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/search");
    cy.intercept("GET", "/api/search?*").as("searchRequest");
  });

  it("should find posts containing a specific hashtag", () => {
    // Search for the hashtag (without the #)
    cy.get('[data-testid="search-input"]').type(`${hashtagQuery}{enter}`);
    cy.wait("@searchRequest");

    // Ensure Posts tab is active or switch to it
    // cy.get('[data-testid="search-tab-posts"]').click();

    // Assert that posts containing the hashtag are listed
    // SearchPage.elements.postResultContent(targetHashtag).should('exist');
    cy.get('[data-testid="search-results-posts"]')
      .find('[data-testid="post-content"]') // Find post content within results
      .should("contain", targetHashtag);

    // Optional: Assert no irrelevant posts are shown
  });

  it("should allow clicking a hashtag in a post to initiate a search", () => {
    // TODO: Need a post with the hashtag visible on another page (e.g., feed)
    cy.visit("/"); // Go to feed
    // Find a post containing the hashtag link
    cy.contains('a[href*="/search?q="]', targetHashtag).click(); // Example selector for hashtag link

    // Assert navigation to the search page with the hashtag pre-filled
    cy.url().should("include", `/search?q=${hashtagQuery}`);
    cy.get('[data-testid="search-input"]').should("have.value", hashtagQuery);

    // Assert search results load for the hashtag
    cy.wait("@searchRequest");
    cy.get('[data-testid="search-results-posts"]')
      .find('[data-testid="post-content"]')
      .should("contain", targetHashtag);
  });
});
