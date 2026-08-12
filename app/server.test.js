const test = require('node:test');
const assert = require('node:assert/strict');

test('application configuration has a default port', () => {
  assert.equal(Number(process.env.PORT || 3000), 3000);
});
