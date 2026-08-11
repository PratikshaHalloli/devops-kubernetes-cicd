const test = require("node:test");
const assert = require("node:assert");

const { app, server } = require("./server");

test("Health endpoint returns 200", async () => {
  const response = await fetch("http://localhost:3000/healthz");

  assert.strictEqual(response.status, 200);

  const body = await response.json();

  assert.strictEqual(body.status, "ok");

  server.close();
});
