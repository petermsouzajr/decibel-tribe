// API Test
describe("[AuthTeam] API - Unauthenticated Access [smoke]", () => {
  it("should return 401 Unauthorized for protected endpoints without credentials", () => {
    cy.request({
      method: "GET",
      url: "/api/get-token", // Changed from /api/profile/me
      failOnStatusCode: false, // Prevent Cypress from failing the test on 4xx/5xx
    }).then((response) => {
      expect(response.status).to.equal(401);
    });
  });

  it("should return 401 Unauthorized for protected POST/PUT endpoints", () => {
    cy.request({
      method: "POST",
      url: "/api/groups", // Changed from /api/posts
      body: { name: "Test Group", description: "Test Desc" }, // Add a body for POST
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.equal(401);
    });

    // Example for PUT/PATCH (using mark-as-read)
    cy.request({
      method: "PATCH",
      url: "/api/notifications/mark-as-read", // Example PATCH endpoint
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.equal(401);
    });
  });

  // Add more endpoints as needed
});
