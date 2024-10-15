Cypress.Commands.add("logoutByApi", () => {
  cy.clearCookie("session");
});

Cypress.Commands.add(
  "loginByApi",
  (username = Cypress.env("username"), password = Cypress.env("password")) => {
    cy.request({
      method: "POST",
      url: "/api/auth/login",
      headers: {
        "Content-Type": "application/json",
      },
      body: { username, password },
      failOnStatusCode: false,
    }).then((response) => {
      if (response.status === 200) {
        const { sessionCookie } = response.body;
        cy.setCookie(sessionCookie.name, sessionCookie.value);
      } else {
        throw new Error(`Login failed with status ${response.status}`);
      }
    });
  },
);
