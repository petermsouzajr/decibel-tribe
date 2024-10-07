cy.request("POST", "/api/auth/logout").then((response) => {
  expect(response.status).to.eq(200);
});
