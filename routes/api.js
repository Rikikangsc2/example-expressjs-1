const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { handleChat } = require('../module/llama');
const {twitter, igdl, ttdl,fbdown} = require('btch-downloader');

///----
router.get('/twitter', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: 'Missing url parameter' });
  try {
    const data = await twitter(url);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.json({ error: 'Failed to download' });
  }
});
router.get('/fbdown', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: 'Missing url parameter' });
  try {
    const data = await fbdown(url);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.json({ error: 'Failed to download' });
  }
});
router.get('/ttdl', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: 'Missing url parameter' });
  try {
    const data = await ttdl(url);
    data.creator = "PurAPI"
    res.json(data);
  } catch (err) {
    console.error(err);
    res.json({ error: 'Failed to download' });
  }
});
router.get('/igdl', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: 'Missing url parameter' });
  try {
    const data = await igdl(url);
    data[0].wm = "PurAPI"
    res.json(data);
  } catch (err) {
    console.error(err);
    res.json({ error: 'Failed to download' });
  }
});
router.get('/llama',async(req,res)=>{
  if (!req.query.user&&!req.query.text&&!req.query.systemPrompt) return res.json({error: "Missing query parameter"});
  handleChat(req,res,null);
})
module.exports = router;