const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  //*   console.log("on rentre dans le middleware");
  //!* console.log(req.headers.authorization.replace("Bearer", ""));
  //   Chercher dans ma BDD si un user a bien ce token
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: "Unauthorized1" });
    }
    const token = req.headers.authorization.replace("Bearer ", "");
    // console.log(token);
    const user = await User.findOne({ token: token })
      // .select("account")
      .populate("account");

    if (!user) {
      return res.status(401).json({ error: "Unauthorized2" });
    } else {
      req.user = user;
      return next();
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports = isAuthenticated;
