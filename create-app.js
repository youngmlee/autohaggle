require('dotenv/config')
const sgMail = require('@sendgrid/mail')
const express = require('express')
const { MongoClient } = require('mongodb')
const ahGateway = require('./ah-gateway')
const bodyParser = require('body-parser')
const path = require('path')
const multer = require('multer')()

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
    let car = req.body.year + ' ' + req.body.color + ' ' + req.body.make + ' ' + req.body.model + ' ' + req.body.trim
    const msg = {
      to: req.body.demail,
      from: 'inbound@parse.auto-haggle.email',
      subject: 'AutoHaggle Price Inquiry',
      text: 'AutoHaggle Inquiry',
      html: 'Hello, this is an automated e-mail sent by AutoHaggle! A user on our site has MANUALLY input your e-mail address to request a price quote through AutoHaggle.<br/>With that in mind, we hope you can participate in the AutoHaggle bidding process by giving your best, honest "Out-The-Door" price quote and honoring it when the time comes.<br/><br/>CUSTOMER REQUEST:<br/><br/>I have a potential customer for you interested in a ' + car + '<br/><br/>Additional details:<br/>Financing: ' + req.body.financing + '<br/>Credit estimation: ' + req.body.credit + '<br/>City of residence: ' + req.body.city + '<br/><br/>Additional details: ' + req.body.details + '<br/><br/>If you wish to participate, here are your three response options.<br/><br/>1. If you have or can get the car and can offer a price quote, reply with "OTD:$XX,XXX" (example: OTD:$24,495)<br/><br/>2. If you need additional details before providing a price quote, reply with "NAD: <your message here>" (example: NAD: Do you want the 18 or 20 inch wheels?)<br/><br/>3. If the requested car is not available you can reply with "CNA" (car not available) and leave it at that or offer a price quote on a slightly different but available car. (example: CNA: No white one but I do have a silver one with those exact trims/options. $25,550)'
    };
    sgMail.sendMultiple(msg);
    console.log('Haggle sent!')

    sendReport(req.body.email, req.body.demail, car)
  })

  app.post('/email-responses', multer.none(), (req, res) => {
    console.log(isolateEmail(req.body.from))
    console.log(isolateHtml(req.body.html))
    const update = {
      "reply" : isolateEmail(req.body.from) + " replied with: " + isolateHtml(req.body.html) + '<br/><br/>'
    }
    postReply(isolateEmail(req.body.from), update)
    res.sendStatus(200)
  })

  return app
}

function retrieveDoc(email) {
  MongoClient.connect(process.env.MONGODB_URI, async (err, db) => {
    const haggles = ahGateway(db.collection('haggles'))
    await haggles
      .findDoc(email)

    db.close()
  })
}

function sendReport(email, demail, carInfo) {
  let replies = ''
  setTimeout(function() {
    MongoClient.connect(process.env.MONGODB_URI, async (err, db) => {
      const haggles = ahGateway(db.collection('haggles'))
      const found = await haggles.findDoc(email)
      replies = found
      db.close()
      console.log('Report one fetched!')
    })
  }, process.env.FETCH_ONE)

  setTimeout(function() {
    MongoClient.connect(process.env.MONGODB_URI, async (err, db) => {
      const haggles = ahGateway(db.collection('haggles'))
      const found = await haggles.findDoc(email)
      replies = found
      db.close()
      console.log('Report two fetched!')
    })
  }, process.env.FETCH_TWO)

  setTimeout(function() {
    MongoClient.connect(process.env.MONGODB_URI, async (err, db) => {
      const haggles = ahGateway(db.collection('haggles'))
      const found = await haggles.findDoc(email)
      replies = found
      db.close()
      console.log('Report three fetched!')
    })
  }, process.env.FETCH_THREE)

  setTimeout(function() {
    if (replies !== '') {
      const reportOne = {
        to: email,
        from: 'inbound@parse.auto-haggle.email',
        subject: 'Your AutoHaggle Bidding Report (1 of 3)',
        text: 'AutoHaggle Report',
        html: 'Regarding your ' + carInfo + ', here is a report of the bidding so far: <br/><br/>' + replies.reply + '<br/><br/>Key: (NAD = Need Additional Details), (CNA = Car Not Available)'
      };
      const dReportOne = {
        to: demail,
        from: 'inbound@parse.auto-haggle.email',
        subject: 'AutoHaggle Bidding Report (1 of 3)',
        test: 'AutoHaggle Report',
        html: 'Regarding the price quote requested on ' + carInfo + ', here is a report of the bidding so far: <br/><br/>' + replies.reply + '<br/><br/>Key: (NAD = Need Additional Details), (CNA = Car Not Available)<br/><br/>You can reply with the same options as before:<br/>1. If you have or can get the car and can offer a price quote, reply with "OTD:$XX,XXX" (example: OTD:$24,495)<br/><br/>2. If you need additional details before providing a price quote, reply with "NAD: <your message here>" (example: NAD: Do you want the 18 or 20 inch wheels?)<br/><br/>3. If the requested car is not available you can reply with "CNA" (car not available) and leave it at that or offer a price quote on a slightly different but available car. (example: CNA: No white one but I do have a silver one with those exact trims/options. $25,550)<br/><br/>You will have 24 hours to give a response that will be reflected in the Day 2 Bidding Report.'
      }
      sgMail.send(reportOne)
      sgMail.sendMultiple(dReportOne)
      console.log('Report one sent!')
    }
  }, process.env.REPORT_ONE) // 24hr = 86400000 ms; 48=172800000; 72=259200000 //

  setTimeout(function() {
    if (replies !== '') {
      const reportTwo = {
        to: email,
        from: 'inbound@parse.auto-haggle.email',
        subject: 'Your AutoHaggle Bidding Report (2 of 3)',
        text: 'AutoHaggle Report',
        html: 'Regarding your ' + carInfo + ', here is a report of the bidding so far: <br/><br/>' + replies.reply + '<br/><br/>Key: (NAD = Need Additional Details), (CNA = Car Not Available)'
      };
      const dReportTwo = {
        to: demail,
        from: 'inbound@parse.auto-haggle.email',
        subject: 'AutoHaggle Bidding Report (2 of 3)',
        test: 'AutoHaggle Report',
        html: 'Regarding the price quote requested on ' + carInfo + ', here is a report of the bidding so far: <br/><br/>' + replies.reply + '<br/><br/>Key: (NAD = Need Additional Details), (CNA = Car Not Available)<br/><br/>You can reply with the same options as before:<br/>1. If you have or can get the car and can offer a price quote, reply with "OTD:$XX,XXX" (example: OTD:$24,495)<br/><br/>2. If you need additional details before providing a price quote, reply with "NAD: <your message here>" (example: NAD: Do you want the 18 or 20 inch wheels?)<br/><br/>3. If the requested car is not available you can reply with "CNA" (car not available) and leave it at that or offer a price quote on a slightly different but available car. (example: CNA: No white one but I do have a silver one with those exact trims/options. $25,550)<br/><br/>This is your last chance to modify your quote. You will have 24 hours to give a response that will be reflected in the Day 3 (Final) Bidding Report.'
      }
      sgMail.send(reportTwo)
      sgMail.sendMultiple(dReportTwo)
      console.log('Report two sent!')
    }
  }, process.env.REPORT_TWO)

  setTimeout(function() {
    if (replies !== '') {
      const reportThree = {
        to: email,
        from: 'inbound@parse.auto-haggle.email',
        subject: 'Final AutoHaggle Bidding Report (3 of 3)',
        text: 'AutoHaggle Report',
        html: 'Regarding your ' + carInfo + ', here is the final report of the bidding: <br/><br/>' + replies.reply + '<br/><br/>Key: (NAD = Need Additional Details), (CNA = Car Not Available)<br/><br/>Thank you for using AutoHaggle!'
      };
      const dReportThree = {
        to: demail,
        from: 'inbound@parse.auto-haggle.email',
        subject: 'Final AutoHaggle Bidding Report (3 of 3)',
        test: 'AutoHaggle Report',
        html: 'Regarding the price quote requested on ' + carInfo + ', here is the final report of the bidding: <br/><br/>' + replies.reply + '<br/><br/>Key: (NAD = Need Additional Details), (CNA = Car Not Available)<br/><br/>Thank you for your participation!'
      }
      sgMail.send(reportThree)
      sgMail.sendMultiple(dReportThree)
      console.log('Report three sent!')
      MongoClient.connect(process.env.MONGODB_URI, async (err, db) => {
        const haggles = ahGateway(db.collection('haggles'))
        await haggles
          .deleteDoc(email)

        db.close()
      })
    }
  }, process.env.REPORT_THREE)
}

function postReply(filter, update) {
  MongoClient.connect(process.env.MONGODB_URI, async (err, db) => {
    const haggles = ahGateway(db.collection('haggles'))
    await haggles
      .updateByEmail(filter, update)

    db.close()
  })
}

function isolateEmail(str) {
  let firstIdx = (str.indexOf('<') + 1)
  let secondIdx = (str.length - 1)
  return str.slice(firstIdx, secondIdx)
}

function isolateHtml(str) {
  let final = ''
  const divCloseIdx = (str.indexOf('</div>'))
  const abridgedStr = str.slice(0, divCloseIdx)
  if (abridgedStr.indexOf('OTD') !== -1) {
    const otdIdx = (str.indexOf('OTD'))
    const otdHtml = str.slice(otdIdx, divCloseIdx)
    const otdNums = otdHtml.replace(/\D/g, '')
    final = '$' + otdNums
  }
  else if (abridgedStr.indexOf('NAD') !== -1) {
    const nadIdx = (str.indexOf('NAD'))
    const nadSliced = str.slice(nadIdx, divCloseIdx)
    const nadHtml = nadSliced.replace(/(&#39;)/g, "'")
    final = nadHtml
  }
  else if (abridgedStr.indexOf('CNA') !== -1) {
    const cnaIdx = (str.indexOf('CNA'))
    const cnaSliced = str.slice(cnaIdx, divCloseIdx)
    const cnaHtml = cnaSliced.replace(/(&#39;)/g, "'")
    final = cnaHtml
  }
  return final
}
