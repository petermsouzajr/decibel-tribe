cy.request("POST", "/api/auth/signup", {
  username: newUsername,
  email: newUserEmail,
  password: newUserPassword,
}).then((response) => {
  expect(response.status).to.eq(201);
  expect(response.body.message).to.eq("Signup successful");
});

cy.request({
  method: "POST",
  url: "/api/auth/signup",
  body: {
    username: unusedUsername,
    email: registeredUserEmail,
    password: newUserPassword,
  },
  failOnStatusCode: false,
}).then((response) => {
  expect(response.status).to.eq(400);
  expect(response.body.error).to.eq("Email already registered");
});
