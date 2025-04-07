declare namespace Cypress {
  interface Chainable {
    loginByApi(username: string, password?: string): Chainable<void>;
    logoutByApi(): Chainable<void>;
    loginViaUi(
      username?: string | null,
      password?: string | null,
    ): Chainable<void>;
    createEventViaApi(eventData?: Partial<any>): Chainable<any>;
  }
}
