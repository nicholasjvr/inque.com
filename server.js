const express = require("express");
const path = require("path");

const app = express();
const port = 8080;

// Serve static files from the root directory of the project.
// This will automatically serve index.html on the root URL.
app.use(express.static(__dirname));

// Start the server.
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
