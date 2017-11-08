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
    MongoClient.connect('mongodb://localhost/autohaggle', async (err, db) => {
      const haggles = ahGateway(db.collection('haggles'))
      const displayed = await haggles.display()
      res.json(displayed)

      db.close()
    })
  })

  app.use(bodyParser.json())

  app.post('/autohaggle', async (req, res) => {
    MongoClient.connect('mongodb://localhost/autohaggle', async (err, db) => {
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
      html: 'Hello there! I have a potential customer for you interested in a ' + req.body.year + ' ' + req.body.make + ' ' + req.body.model + '. Additional details: ' + req.body.financing + req.body.credit + req.body.city + req.body.details + '. Could you give a price quote for such a car?',
    };
    sgMail.send(msg);
    console.log('E-mail has been sent! ' + msg)
  })

  return app
}
