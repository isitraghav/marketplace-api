const requestIp = require("request-ip");
const { rateLimit } = require("express-rate-limit");
const express = require("express");
const { default: axios } = require("axios");
const cache = require("memory-cache");
const app = express();
const cors = require("cors");
var _ = require("underscore");

app.use(require("sanitize").middleware);
app.use(express.json());
app.use(
  cors({
    origin: "*",
    allowedHeaders: "*",
    preflightContinue: true,
  })
);

app.set("trust proxy", 1);
app.get("/ip", (request, response) => response.json({ ip: request.ip }));

app.all("/", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// Apply the rate limiting middleware to all requests
app.use(limiter);

app.get("/api/cache", async (req, res) => {
  let data = req.query;
  if (_.has(data, "pub")) {
    cache.del(data.pub);
  }
  res.json({});
});

app.get("/api/clearallcache", async (req, res) => {
  let data = req.query;
  if (_.has(data, "pass")) {
    if (data.pass == "Raghav1979") {
      res.json(JSON.parse(cache.exportJson()));
      cache.clear();
      return;
    }
  }
  res.json({
    m: "wrong or no password",
  });
});

app.listen(process.env.PORT || 3000);

module.exports = app;
