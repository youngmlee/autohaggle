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

  app.get('/autohaggle', async (req, res) => {
    MongoClient.connect(process.env.MONGODB_URI, async (err, db) => {
      const haggles = ahGateway(db.collection('haggles'))
      const displayed = await haggles.display()
      res.json(displayed)

      db.close()
    })
  })

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
      html: 'Hello! A user has MANUALLY input your e-mail address to request a price quote through AutoHaggle.<br/>With that in mind, we hope you can participate in the AutoHaggle bidding process.<br/><br/>I have a potential customer for you interested in a ' + req.body.year + ' ' + req.body.make + ' ' + req.body.model + '.<br/><br/>Additional details:<br/>Financing: ' + req.body.financing + ' Credit estimation: ' + req.body.credit + ' City of residence: ' + req.body.city + '<br/><br/>Additional details: ' + req.body.details + '<br/><br/>Could you give me your lowest OTD price quote for such a car? Thank you for your time.',
    };
    sgMail.send(msg);
    console.log('E-mail has been sent!')
  })

  return app
}
