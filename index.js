// api/index.js
const express = require("express");
const serverless = require("serverless-http");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;

// Basic sanity check:
if (!GMAIL_USER || !GMAIL_PASS) {
  console.warn("GMAIL_USER or GMAIL_PASS not set. Emails will fail.");
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS
  }
});

app.get("/", (req, res) => res.json({ ok: true, version: "1.0" }));


app.post("/api/send-otp", async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ error: "email and otp are required" });
    }

    // Optional: basic rate-limiting / spam control could be added here (in production)
    // Compose mail
    const mailOptions = {
      from: `"LivetoTravel" <${GMAIL_USER}>`,
      to: email,
      subject: "Your verification code",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
      html: `<p>Your OTP is <strong>${otp}</strong>. It will expire in 5 minutes.</p>`
    };

    const info = await transporter.sendMail(mailOptions);
    return res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error("send-otp error:", err);
    return res.status(500).json({ error: "Failed to send email", details: err.message });
  }
});

// export for Vercel (serverless)
module.exports = app;
module.exports.handler = serverless(app);
