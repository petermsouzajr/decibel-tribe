// API Test - does not require UI interaction

describe("[SocialTeam] API - Search Endpoint (/api/search) [functional]`", () => {
  const searchQuery = "testQuery";

  before(() => {
    // TODO: Seed database with data that should match the searchQuery
    // (e.g., users named testQueryUser, posts containing testQuery)
  });

  beforeEach(() => {
    // Ensure environment variables TEST_USER_EMAIL, TEST_USER_PASSWORD are set for loginViaUi
    cy.loginViaUi(); // Login via UI to establish session
  });

  it("should return relevant results for a general query", () => {
    cy.request(`/api/search?q=${searchQuery}`).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.be.an("object");
      expect(response.body).to.include.keys("users", "posts", "events");

      // Add more specific assertions based on seeded data
      expect(response.body.users).to.be.an("array");
      // expect(response.body.users.some(user => user.username.includes(searchQuery))).to.be.true;
      expect(response.body.posts).to.be.an("array");
      // expect(response.body.posts.some(post => post.content.includes(searchQuery))).to.be.true;
    });
  });

  it("should filter results by type (e.g., only users)", () => {
    cy.request(`/api/search?q=${searchQuery}&type=users`).then((response) => {
      expect(response.status).to.eq(200);
      // Assert only users array is populated or returned
      expect(response.body.users).to.be.an("array");
      expect(response.body.posts).to.be.an("array").that.is.empty; // Example check
      expect(response.body.events).to.be.an("array").that.is.empty; // Example check
    });
  });

  it("should handle queries with no results gracefully", () => {
    cy.request("/api/search?q=veryUnlikelyStringToExist12345").then(
      (response) => {
        expect(response.status).to.eq(200);
        expect(response.body.users).to.be.an("array").that.is.empty;
        expect(response.body.posts).to.be.an("array").that.is.empty;
        expect(response.body.events).to.be.an("array").that.is.empty;
      },
    );
  });

  // Add tests for pagination, special characters, etc.
});
