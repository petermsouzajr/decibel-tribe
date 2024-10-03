declare namespace Cypress {
  interface Chainable {
    loginByApi(username: string, password: string): Chainable<void>;
    logoutByApi(): Chainable<void>;
  }
}
