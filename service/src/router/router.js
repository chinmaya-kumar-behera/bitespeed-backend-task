const express = require("express");
const { identifyController } = require("../controller/contactController");
const router = express.Router();

router.get("/", (req, res) => {
    res.json({ message: "API is working " });
})

router.post("/identify", identifyController);

module.exports = router; 
