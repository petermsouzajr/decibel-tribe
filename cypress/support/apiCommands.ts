Cypress.Commands.add("loginByApi", (username, password) => {
  // Use provided credentials. Ensure both are provided.
  if (!username || !password) {
    throw new Error(
      "loginByApi: Username and/or password arguments were not provided.",
    );
  }

  cy.log(`LOGGING IN AS ${username} VIA API`);

  cy.request({
    method: "POST",
    url: "/api/auth/login", // Assuming this is the correct endpoint
    body: {
      username: username, // Use the provided username
      password: password, // Use the provided password
    },
    failOnStatusCode: false, // Handle failure manually
  }).then((response) => {
    // Explicitly check for 200 OK
    if (response.status !== 200) {
      throw new Error(
        `API login failed for user ${username}. Status: ${response.status}. Body: ${JSON.stringify(response.body)}`,
      );
    }
    cy.log(`API login successful for ${username}`);
    // No need to assert here if we throw on failure.
    // Cookie handling is usually automatic with cy.request
  });
});

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
