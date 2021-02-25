var express = require('express')
var router = express.Router()
const uniqid = require('uniqid')
const fs = require('fs')
require('dotenv').config()
const request = require('sync-request')

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
      res.json({result: false, error: "Issue copying photo to /tmp folder"})
      return
    }
  })
  try {
    await cloudinary.uploader.upload(path, async (error, response) => {
      if (error) {
        fs.unlinkSync(path)
        res.json({result: false, error: "Issue uploading photo to cloudinary"})
      } else {
        const params = {
          returnFaceId: 'true',
          returnFaceLandmarks: 'false',
          returnFaceAttributes: 'age,gender,smile,facialHair,glasses,emotion,hair',
         }
        const options = {
          qs: params,
          body: JSON.stringify({url: response.secure_url}),
          headers: {
              'Content-Type': 'application/json',
              'Ocp-Apim-Subscription-Key' : process.env.SUB_KEY
          }
         }
        const rawData = await request('POST', process.env.URI_BASE, options)
        const data = await JSON.parse(rawData.body)

        const {gender, age, facialHair, smile, hair} = data[0].faceAttributes
        const faceData = {
          gender,
          age,
          beard: facialHair.beard > 0 ? true : false,
          hair : hair.hairColor[0].color,
          smile: smile > 0 ? true : false
        }
        fs.unlinkSync(path)
        res.json({result: true, response, faceData})
      }
    })
  } catch (error) {
    console.log("in catch block")
    console.log(error)
  }
  
})

router.post('/upload-video', async (req,res) => {
  const path = './tmp/'+uniqid()+'.mov'

  await req.files.video.mv(path, (err) => {
    if (err) {
      res.json({result: false, error: "Issue copying video to /tmp folder"})
      return
    }
  })

  await cloudinary.uploader.upload(path, {resource_type: 'video'}, (error, response) => {
    if (error) {
      fs.unlinkSync(path)
      res.json({result: false, error: "Issue uploading video to cloudinary"})
    } else {
      fs.unlinkSync(path)
      res.json({result: true, response})
    }
  })
})

module.exports = router;
