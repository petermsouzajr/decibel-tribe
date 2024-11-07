// Sample Configuration File: Adjust values below to match your project's setup

module.exports = {
  // Uncomment the relevant teams or add your own in the Describe block or It block:
  //  describe('[oregano] Unit test our math functions', () => {
  //    context('math', () => {
  //      it('can add numbers [C2452][smoke]', () => {
  teamNames: [
    "Baron",
    //'wilkins',
    //'canonicus',
  ],
  // (default list) Uncomment the relevant test types or add your own by modifying your folder structure [framework]/ui/1-getting-started/todo.cy.js:
  testTypes: [
    // 'api',
    // 'ui',
    // 'unit',
    // 'integration',
    // 'endToEnd',
    // 'performance',
    // 'security',
    // 'database',
    // 'accessibility',
    // 'mobile',
  ],
  // (default list) Uncomment the relevant test categories or add your own in the Describe block or It block:
  //  describe('[oregano] Unit test our math functions', () => {
  //    context('math', () => {
  //      it('can add numbers [C2452][smoke]', () => {
  testCategories: [
    // 'smoke',
    // 'regression',
    // 'sanity',
    // 'exploratory',
    // 'functional',
    // 'load',
    // 'stress',
    // 'usability',
    // 'compatibility',
    // 'alpha',
    // 'beta',
  ],
  // Replace with the actual Google Spreadsheet ID, found in the URL:
  googleSpreadsheetId: process.env.GOOGLE_SHEET_URL,

  // Path to your Google credentials file, service account credentials JSON file:
  googleKeyFilePath: process.env.GOOGLE_KEY_FILE_PATH,

  // Path to your test data results, matching the output format of the test runner:
  testData: process.env.CYPRESS_RESULTS_PATH,

  // Default path to the directory where CSV downloads will be saved:
  // (optional) uncomment and replace with your desired path:
  // csvDownloadsPath: "downloads",
};
