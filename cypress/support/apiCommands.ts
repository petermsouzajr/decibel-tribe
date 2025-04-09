Cypress.Commands.add(
  "loginByApi",
  (username, password = Cypress.env("password")) => {
    cy.log(`Logging in as ${username}`);
    cy.request({
      method: "POST",
      url: "/api/auth/login",
      body: { username, password },
      failOnStatusCode: false, // Allow handling of 4xx/5xx responses
    }).then((response) => {
      if (response.status !== 200) {
        // Log the error if login fails
        cy.log(`Login failed: ${response.body.error || "Unknown error"}`);
        // Optionally throw an error or handle it as needed
        throw new Error(
          `API login failed for user ${username}: ${response.body.error || response.status}`,
        );
      }
      // Log success and potentially store session info if needed
      cy.log("Login successful via API");
      // The session cookie is automatically handled by the browser during cy.request
      // No need to manually set cookies unless the app requires it differently
    });
  },
);

// --- Create Event via API Command ---
Cypress.Commands.add("createEventViaApi", (eventData: Partial<any> = {}) => {
  cy.log("Creating event via API");

  // Ensure required fields have default values if not provided
  const defaults = {
    title: "API Test Event",
    location: "API Test Location",
    description: "Created via cy.createEventViaApi",
    url: null,
    when: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    startTime: "19:00",
    endTime: "21:00",
    performers: [],
    status: "PUBLISHED", // Default to published for testing visibility
    visibility: "PUBLIC", // Default to public for testing visibility
    isCancelled: false,
  };

  // Now spreading should be safe as eventData is typed
  const payload = { ...defaults, ...eventData };

  return cy
    .request({
      method: "POST",
      url: "/api/events", // Endpoint identified from search
      body: payload, // Send the event data
      failOnStatusCode: true, // Fail on non-2xx status codes by default
    })
    .then((response) => {
      expect(response.status).to.eq(201); // Expect 'Created'
      cy.log(`Event created via API with ID: ${response.body.id}`);
      // Return the response body (contains the created event)
      return response.body;
    });
});
