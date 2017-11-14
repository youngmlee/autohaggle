require('dotenv/config')
const sgMail = require('@sendgrid/mail')
const express = require('express')
const { MongoClient } = require('mongodb')
const ahGateway = require('./ah-gateway')
const bodyParser = require('body-parser')
const path = require('path')

module.exports = function createApp() {
  const app = express()
  app.use(express.static(path.join(__dirname, 'public')))

  app.use(bodyParser.json())

  app.post('/autohaggle', async (req, res) => {
    MongoClient.connect(process.env.MONGODB_URI, async (err, db) => {
      const haggles = ahGateway(db.collection('haggles'))
      await haggles
        .createHaggle(req.body)
        .then(created => res.json(created))

      db.close()
    })
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: req.body.demail,
      from: 'autohagglebot@gmail.com',
      subject: 'AutoHaggle Price Inquiry',
      text: 'AutoHaggle inquiry',
      html: 'Hello, this is an automated e-mail sent by AutoHaggle! A user on our site has MANUALLY input your e-mail address to request a price quote through AutoHaggle.<br/>With that in mind, we hope you can participate in the AutoHaggle bidding process by giving your best, honest price quote and honoring it when the time comes.<br/><br/>CUSTOMER REQUEST:<br/><br/>I have a potential customer for you interested in a ' + req.body.year + ' ' + req.body.color + ' ' + req.body.make + ' ' + req.body.model + ' ' + req.body.trim + '.<br/><br/>Additional details:<br/>Financing: ' + req.body.financing + '<br/>Credit estimation: ' + req.body.credit + '<br/>City of residence: ' + req.body.city + '<br/><br/>Additional details: ' + req.body.details + '<br/><br/>If you have this car, could you reply with your lowest "Out-The-Door" price quote for such a car? Thank you for your time.',
    };
    sgMail.send(msg);
    console.log('E-mail has been sent!')
  })

  return app
}
