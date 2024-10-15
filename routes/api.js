const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { handleChat } = require('../module/llama');

///----
router.get('/llama',async(req,res)=>{
  if (!req.query.user&&!req.query.text&&!req.query.systemPrompt) return res.json({error: "Missing query parameter"});
  handleChat(req,res,null);
})
module.exports = router;