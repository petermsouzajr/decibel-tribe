// API Test - does not require UI interaction

// import { generateGroupData } from "../../../factories/groupFactory"; // Reverted import

describe("[GroupsTeam] API - Group Creation Validation (/api/groups) [functional]", () => {
  let authToken: string; // Store auth token/cookie if needed
  let existingGroupName = "PreExistingGroupForConflictTest"; // Hardcoded name

  before(() => {
    // TODO: Login as a user via API and store auth credentials/token
    // cy.loginByApi('apiTestUser', Cypress.env('password')).then(token => authToken = token);
  });

  beforeEach(() => {
    // Ensure environment variables TEST_USER_EMAIL, TEST_USER_PASSWORD are set for loginViaUi
    // @ts-ignore
    cy.loginViaUi(); // Login via UI to establish session

    // Ensure the group for the conflict test exists
    cy.request({
      method: "POST",
      url: "/api/groups",
      body: {
        name: existingGroupName,
        description: "Setup for conflict test",
        isPrivate: false,
      },
      failOnStatusCode: false, // Allow conflict (409) if it already exists
    }).then((response) => {
      if (response.status !== 201 && response.status !== 409) {
        throw new Error(
          `Failed to ensure group exists for conflict test, status: ${response.status}`,
        );
      }
      cy.log(`Ensured group exists for conflict test: ${existingGroupName}`);
    });
  });

  it("should return 400 Bad Request if group name is missing", () => {
    cy.request({
      method: "POST",
      url: "/api/groups",
      body: {
        // name: is missing
        description: "Group without a name",
        isPrivate: false,
      },
      failOnStatusCode: false, // Expecting 400
    }).then((response) => {
      expect(response.status).to.eq(400);
    });
  });

  it("should return 400 Bad Request if description is missing", () => {
    cy.request({
      method: "POST",
      url: "/api/groups",
      body: {
        name: "GroupWithoutDescription",
        // description: is missing
        isPrivate: false,
      },
      failOnStatusCode: false, // Expecting 400
    }).then((response) => {
      expect(response.status).to.eq(400);
    });
  });

  it("should return 409 Conflict if group name already exists", () => {
    cy.request({
      method: "POST",
      url: "/api/groups",
      body: {
        name: existingGroupName, // Use the name ensured in beforeEach
        description: "Trying to create duplicate",
        isPrivate: false,
      },
      failOnStatusCode: false, // Expecting 409
    }).then((response) => {
      expect(response.status).to.eq(409);
    });
  });

  // Add tests for invalid privacy settings, length validations, etc.
});
