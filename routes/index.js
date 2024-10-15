const express = require('express');
const router = express.Router();

router.get("/",function(req,res){
  res.render("home")
});

router.get("/docs",function(req,res) {
  res.render("docs");
})

module.exports = router;