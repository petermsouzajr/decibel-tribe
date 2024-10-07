cy.request("POST", "/api/auth/login", {
  username: validUsername,
  password: validPassword,
}).then((response) => {
  expect(response.status).to.eq(200);
  expect(response.body).to.have.property("sessionToken");
});

cy.request({
  method: "POST",
  url: "/api/auth/login",
  body: { username: invalidUsername, password: invalidPassword },
  failOnStatusCode: false,
}).then((response) => {
  expect(response.status).to.eq(401);
  expect(response.body.error).to.eq("Invalid credentials");
});

cy.request({
  method: "POST",
  url: "/api/auth/login",
  body: { username: invalidUsername, password: invalidPassword },
  failOnStatusCode: false,
}).then((response) => {
  expect(response.status).to.eq(401);
  expect(response.body.error).to.eq("Invalid credentials");
});
