const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (like your HTML, CSS, and JS)
app.use(express.static(path.join(__dirname)));

// Route to handle form submission
app.post("/save-message", (req, res) => {
  const message = req.body.message;

  // Append the message to a text file
  fs.appendFile("messages.txt", `${message}\n`, (err) => {
    if (err) {
      console.error("Error saving message:", err);
      return res
        .status(500)
        .send("An error occurred while saving your message.");
    }
    res.send("Message saved successfully! <a href='/'>Go back</a>");
  });
});

// Routes for timeline navigation pages
app.get("/page1.html", (req, res) => {
  res.sendFile(path.join(__dirname, "page1.html"));
});

app.get("/page2.html", (req, res) => {
  res.sendFile(path.join(__dirname, "page2.html"));
});

app.get("/page3.html", (req, res) => {
  res.sendFile(path.join(__dirname, "page3.html"));
});

app.get("/page4.html", (req, res) => {
  res.sendFile(path.join(__dirname, "page4.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
