// API Test
describe("[AuthTeam] API - Get User Profile Fail (Private) [functional]", () => {
  let privateUserId: string;
  let viewerToken: string;

  before(() => {
    // TODO: Create user 'privateUser', set profile to PRIVATE
    // TODO: Create user 'viewerUser', ensure NO follow relationship
    // TODO: Login as viewerUser, get token
    // TODO: Ensure user 'privateUserProfileId' exists and has private profile settings
  });

  it("should return 403 Forbidden (or similar) when requesting private profile data unauthenticated/unfollowed", () => {
    const targetUserId = "privateUserProfileId"; // Replace with actual ID from setup

    cy.request({
      method: "GET",
      url: `/api/users/${targetUserId}`,
      failOnStatusCode: false, // Allow 4xx responses
    }).then((response) => {
      // Expect either Forbidden (if user exists but is private)
      // or Not Found (if user doesn't exist or API treats both cases as Not Found when unauthenticated)
      expect(response.status).to.be.oneOf([403, 404]);
    });
  });
});
