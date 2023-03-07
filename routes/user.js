const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const fileUpload = require("express-fileupload");
const convertToBase64 = require("../utils/convertToBase64");
const cloudinary = require("cloudinary").v2;

const User = require("../models/User");

router.post("/user/signup", fileUpload(), async (req, res) => {
  const { username, password, email, newsletter } = req.body;

  try {
    const newUserEmail = await User.findOne({
      email: email,
      username: username,
    });
    if (newUserEmail) {
      return res
        .status(409)
        .json({ message: "This email already has an account" });
    } else {
      //! je peux donner falsy tous les objets pour verrouiler que tous les champs soit remplies pour  typeof {(newletter !== boolean)}
      // if (username && email && password) {
      // * const usePassword = password;
      //* console.log("password:", usePassword);
      const salt = uid2(16);
      //! console.log("salt:", salt);
      const hash = SHA256(password + salt).toString(encBase64);
      //! console.log("hash:", hash);
      const token = uid2(64);
      //! console.log("token:", token);

      const newUser = await new User({
        salt: salt,
        hash: hash,
        token: token,
        email: email,
        account: {
          username: username,
        },
        newsletter: newsletter,
        //!  password: password, ne pas enregistrer où le placer dans la nouvelle variable
      });
      // else { return res.status(200).json("you are in a good way ")}
      if (req.files?.avatar) {
        const result = await cloudinary.uploader.upload(
          convertToBase64(req.files.avatar),
          {
            folder: "api/Vinted/users/${newUser._id}",
            public_id: "avatar",
          }
        );
        newUser.account.avatar = result;
      }

      // !console.log(newUser);
      await newUser.save();
      res.status(200).json({
        _id: newUser._id,
        token: newUser.token,
        email: newUser.email,
        account: newUser.account,
      });
      console.log(newUser);
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
});
router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // !  console.log(req.body);
    // * Aller chercher le user dont le mail est celui reçu
    const user = await User.findOne({ email: email });
    console.log(email);
    // *si on en trouve pas on envoie une erreur
    if (user) {
      // *Recréer un hash à partir du salt du user trouvé et du MDP reçu
      const newHash = SHA256(password + user.salt).toString(encBase64);
      console.log(newHash);
      console.log(user.hash);
      if (newHash === user.hash) {
        res.json({
          _id: user._id,
          token: user.token,
          account: user.account,
        });
      } else {
        res.status(401).json({ error: "Unauthorized" });
      }
    } else {
      res.status(400).json({ message: "User not found" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
