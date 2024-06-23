const requestIp = require("request-ip");
const { rateLimit } = require("express-rate-limit");
const express = require("express");
const { default: axios } = require("axios");
const cache = require("memory-cache");
const app = express();
const cors = require("cors");
var _ = require("underscore");
require('dotenv').config()

const createClient = require("@supabase/supabase-js").createClient;
const supabase = createClient(
  "https://upfmlmvmdaeuznmishjb.supabase.co",
  process.env.SUPABASE_KEY
);

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
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
// Apply the rate limiting middleware to all requests
app.use(limiter);

app.get("/feed/:from/:to", async (req, res) => {
  await supabase
    .from("list")
    .select("*")
    .filter('approved', 'eq', true)
    .range(req.params.from, req.params.to)
    .limit(5)
    .then(({ data, error }) => {
      if (error) {
        console.log(error);
      }
      res.json(data);
    });
});

app.post("/list", async (req, res) => {
  const { name, description, price, owner, ship, image } = req.body;
  if (!/^(.|\s)*[a-zA-Z]+(.|\s)*$/.test(name)) {
    return res.status(400).json({ error: "Query can only contain letters, numbers, spaces, and these special characters: /, -, +, _, ., @" });
  }
  if (name.length < 5 || name.length > 500 || description.length > 5000) {
    return res.status(400).json({ error: "Query must be between 3 and 50 characters long" });
  }
  if (name === "" || description === "") {
    return res.status(400).json({ error: "Name and description cannot be empty" });
  }
  await supabase
    .from("list")
    .insert({
      name,
      description,
      price,
      owner,
      ship,
      images: [`https://ucarecdn.com/${image}/-/preview/500x500/`],
    })
    .then(({ data, error }) => {
      if (error) {
        console.log(error);
      }
      res.json(data);
    });
});

app.get("/search/:name", async (req, res) => {
  const name = req.params.name;
  if (!/^[a-zA-Z0-9]*$/.test(name)) {
    return res.status(400).json({ error: "Query can only contain letters and numbers" });
  }
  if (name.length < 3) {
    return res.status(400).json({ error: "Query must be at least 3 characters" });
  }
  const { data, error } = await supabase
    .from("list")
    .select("*")
    .ilike("description", `%${name}%`)
    .ilike("name", `%${name}%`)
    
  if (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error" });
  }

  res.json(data);
});

app.listen(process.env.PORT || 3000);

module.exports = app;
