const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");

require("dotenv").config();

// !placer seulement la variable fileUpload après la route plutôt que app.use(fileUpload) comme avec express
// const cloudinary = require("cloudinary").v2;
// !.env
//! node_modules
// !package-lock.json
const app = express();
app.use(cors());
app.use(express.json());

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGODB_URI);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const offerRoutes = require("./routes/offer");
app.use(offerRoutes);
const userRoutes = require("./routes/user");
app.use(userRoutes);
const paymentRoutes = require("./routes/payments.js");
app.use(paymentRoutes);

app.all("*", (req, res) => {
  res.status(400).json({ message: "Not found" });
});
app.listen(process.env.PORT, () => {
  console.log("server started");
});
