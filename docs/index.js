const express = require("express");
const path = require("path");

const app = express();
const PORT = 3001;

// Serve static content from the "static" folder
app.use(express.static(path.join(__dirname, "static")));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
