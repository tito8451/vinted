const express = require("express");
const router = express.Router();

const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const Offer = require("../models/Offer");

const isAuthenticated = require("../middlewares/isAuthenticated");
const convertToBase64 = require("../utils/convertToBase64");
// !convertToBase64(req.file.picture[0]); à voir où dois-je le placer juste après le try dans un premier temps

router.get("/offers", async (req, res) => {
  try {
    const filters = {};
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }
    if (req.query.priceMin) {
      filters.product_price = {
        $gte: Number(req.query.priceMin),
      };
    }

    if (req.query.priceMax) {
      // filters.product_price={
      //   $lte: Number(req.query.priceMax)
      // }
      if (filters.product_price) {
        filters.product_price.$lte = Number(req.query.priceMax);
      } else {
        filters.product_price = {
          $lte: Number(req.query.priceMax),
        };
      }
    }
    // console.log(filters.product_price)
    const sort = {};
    if (req.query.sort === "price-desc") {
      sort.product_price = -1; //"desc"
    } else if (req.query.sort === "price-asc") {
      sort.product_price = 1; //"asc"
    }
    let limit = 2; //*nombre de résultat par page
    if (req.query.page) {
      limit = req.query.limit;
    }
    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const skip = (page - 1) * limit;
    const results = await Offer.find(filters)
      .populate({
        path: "owner",
        select: "account",
      })
      .sort(sort)
      .skip(skip)
      .limit(limit);
    // .select("product_name product_price -_id");
    // const offers = await Offer.find({})
    //   .skip(1)
    //   .limit(7)
    //   .select("product_name product_price -_id");
    // console.log(sort.product_price);
    // console.log(skip);
    const count = await Offer.countDocuments(filters);
    res.json({ count: count, offers: results });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );
    // console.log(req.params.owner); test mais pas correct

    res.json(offer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      // console.log(req.headers.authorization.replace("Bearer", ""));
      // console.log(req.user);
      // *console.log(req.files);
      // *console.log(convertToBase64(req.files.picture));
      //   const owner = await User.findOne({ token: req.user.token });
      const result = await cloudinary.uploader.upload(
        convertToBase64(req.files.picture)
      );
      // console.log(result);

      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { MARQUE: brand },
          { TAILLE: size },
          { ETAT: condition },
          { COULEUR: color },
          { EMPLACEMENT: city },
        ],
        product_image: result,
        // *  aller chercher l'id dstocké dans user
        owner: req.user,
      });
      await newOffer.save();
      res.json(newOffer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

module.exports = router;
