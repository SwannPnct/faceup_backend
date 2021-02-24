var express = require('express')
var router = express.Router()
const uniqid = require('uniqid')
const fs = require('fs')
require('dotenv').config()

const cloudinary = require('cloudinary').v2
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.API_KEY, 
  api_secret: process.env.API_SECRET
})

router.post('/upload', async (req,res) => {
  const path = './tmp/'+uniqid()+'.jpg'
  await req.files.photo.mv(path, (err) => {
    if (err) {
      fs.unlinkSync(path)
      res.json({result: false, error: "Issue copying photo to /tmp folder"})
      return
    }
  })

  await cloudinary.uploader.upload(path, (error, response) => {
    if (error) {
      fs.unlinkSync(path)
      res.json({result: false, error: "Issue uploading photo to cloudinary"})
    } else {
      fs.unlinkSync(path)
      res.json({result: true, response})
    }
  })
})

module.exports = router;
