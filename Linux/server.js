const express = require("express");
const path = require("path");
const log = require("./logger")
function startFrontendServer() {
  const app = express();

  // تخدم ملفات من public
  app.use(express.static(path.join(__dirname, "public")));

  // صفحة أساسية
  app.get("/", (req, res) => {
    res.send("<h1>Messenger Bot is Running ✔</h1>");
  });

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    log.info("Frontend server running on port " + PORT);
  });
}

module.exports = startFrontendServer;
