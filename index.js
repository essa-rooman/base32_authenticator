const express = require("express");
const bodyParser = require("body-parser");
const JsonDB = require("node-json-db").JsonDB;
const Config = require("node-json-db/dist/lib/JsonDBConfig").Config;
const uuid = require("uuid");
const QRCode = require("qrcode");
const speakeasy = require("speakeasy");
const app = express();
//
var db = new JsonDB(new Config("myDataBase", true, false, "/"));

//
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.get("/api", (req, res) => {
  res.json({ mesage: "hello i am essa" });
});

app.post("/api/register", (req, res) => {
  const id = uuid.v4();
  const { name, email } = req.body;

  try {
    const path = `/user/${id}`;
    const secrit_key = speakeasy.generateSecret();
    // const qrcode = QRCode.toDataURL(secrit_key.otpauth_url);
    db.push(path, { id, secrit_key });
    res.json({ id, secret: secrit_key.base32, name, email });
    console.log({ id, secret: secrit_key.base32, name, email });
  } catch (err) {
    console.log(err);
    res.json({ message: "Error generating secret key" });
  }
});

app.post("/api/verify", (req, res) => {
  const { userId, token } = req.body;
  try {
    // Retrieve user from database
    const path = `/user/${userId}`;
    const user = db.getData(path);

    const { base32: secret } = user.secrit_key;
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
    });
    if (verified) {
      // Update user data
      db.push(path, { id: userId, secret: user.secrit_key });
      res.json({ verified: true });
    } else {
      res.json({ verified: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving user" });
  }
});
app.post("/api/validate", (req, res) => {
  const { userId, token } = req.body;
  try {
    // Retrieve user from database
    const path = `/user/${userId}`;
    const user = db.getData(path);
    console.log({ user });
    const { base32: secret } = user.secret;
    const tokenValidates = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1,
    });
    if (tokenValidates) {
      res.json({ validated: true });
    } else {
      res.json({ validated: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving user" });
  }
});
const port = 3000;
app.listen(port, () => {
  console.log(`server is listing at ${port}`);
});
