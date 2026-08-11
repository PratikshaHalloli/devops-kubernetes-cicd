const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({
    message: "DevOps Demo API is running........"
  });
});

app.get("/healthz", (req, res) => {
  res.status(200).json({
    status: "ok"
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };
