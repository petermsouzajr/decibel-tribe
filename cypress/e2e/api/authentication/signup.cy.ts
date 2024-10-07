cy.request("POST", "/api/auth/signup", {
  // @ts-ignore
  username: newUsername,
  // @ts-ignore
  email: newUserEmail,
  // @ts-ignore
  password: newUserPassword,
}).then((response) => {
  expect(response.status).to.eq(201);
  expect(response.body.message).to.eq("Signup successful");
});

cy.request({
  method: "POST",
  url: "/api/auth/signup",
  body: {
    // @ts-ignore
    username: unusedUsername,
    // @ts-ignore
    email: registeredUserEmail,
    // @ts-ignore
    password: newUserPassword,
  },
  failOnStatusCode: false,
}).then((response) => {
  expect(response.status).to.eq(400);
  expect(response.body.error).to.eq("Email already registered");
});
