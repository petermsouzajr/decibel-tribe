// API Test
describe("[EventsTeam] API - Event Attendance Check [functional]", () => {
  let eventId: string;
  // Using loginViaUi which handles session via cookies, no token needed directly
  // let attendeeToken: string;
  // let nonAttendeeToken: string;

  beforeEach(() => {
    // Login as the primary test user (who will create the event)
    // Ensure environment variables TEST_USER_EMAIL, TEST_USER_PASSWORD are set
    // @ts-ignore
    cy.loginViaUi(); // Use UI login which uses cy.session

    // Create a new event via API command and store its ID
    // @ts-ignore
    cy.createEventViaApi({
      title: "Attendance Test Event",
      // Add other necessary event data if defaults aren't sufficient
    }).then((createdEvent) => {
      expect(createdEvent).to.have.property("id");
      eventId = createdEvent.id; // Store the ID
      cy.log(`Created event with ID: ${eventId}`);
      // By default, the creator is an attendee
    });
  });

  // Test needs to be updated - assumption of token is likely wrong
  // and the endpoint /attendance-status needs verification
  it.skip("should reflect correct attendance status for an attendee", () => {
    // cy.request({
    //   url: `/api/events/${eventId}/attendance-status`, // Hypothetical endpoint
    //   // Cookies should be handled automatically by Cypress
    //   // headers: { Authorization: `Bearer ${attendeeToken}` },
    // }).then((response) => {
    //   expect(response.status).to.eq(200);
    //   expect(response.body.isAttending).to.be.true;
    // });
  });

  // Test needs to be updated - non-attendee logic and endpoint verification needed
  it.skip("should reflect correct attendance status for a non-attendee", () => {
    // This requires logging in as a *different* user who hasn't attended
    // cy.request({
    //   url: `/api/events/${eventId}/attendance-status`,
    //   // Cookies should be handled automatically by Cypress
    //   // headers: { Authorization: `Bearer ${nonAttendeeToken}` },
    // }).then((response) => {
    //   expect(response.status).to.eq(200);
    //   expect(response.body.isAttending).to.be.false;
    // });
  });
});
