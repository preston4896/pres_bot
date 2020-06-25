"strict mode";

const express = require("express");
const bodyParser = require("body-parser");
const app = express().use(bodyParser.json());
const request = require("request");
require("dotenv").config();
const nlp = require("./nlp");
const attachment = require("./attachment");
const reply = require("./reply");

// global variable to store user.
var sendingAsPersona = false;
var sender_psid = -1;

// debug
const util = require("util");

app.listen(process.env.PORT || 1337, () => console.log("listening..."));

// Error handling
process.on("uncaughtException", err => {
    console.log("Developer side error: " + err);
})

// GET REQUEST - VERIFY WEBHOOK
app.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = process.env.VERIFY_TOKEN;

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});

// After verification, listen for messages via POST request, then PARSE.
app.post('/webhook', (req, res) => {

    let body = req.body;

    // Checks this is an event from a page subscription
    if (body.object === 'page') {

        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function (entry) {
            // Gets the message. entry.messaging is an array, but 
            // will only ever contain one message, so we get index 0
            let webhook_event = entry.messaging[0];

            // Get the sender's PSID
            sender_psid = webhook_event.sender.id;
            get_user_profile_then_respond(sender_psid, webhook_event);
        });

        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
    } 
    else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
});

// Handles messages events
function handleMessage(user, received_message) {
    let response;

    // check if the message contains text
    if (received_message.text) {
        // debug
        console.log("Message received: "+received_message.text);
        response = nlp.response(received_message.nlp, received_message.text, user);
    }

    else if (received_message.attachments) {
        // Get the URL of the attachment
        let attachment_url = received_message.attachments[0].payload.url;
        response = attachment.responseAttachment(attachment_url);
    }

    // sends the response
    callSendAPI(user.id, response);
}

// Handles messaging_postbacks events
function handlePostback(user, received_postback) {
    let response;

    // get the payload for the postback
    let payload = received_postback.payload;

    response = attachment.handleAttachmentPayload(payload);
    
    // send the response
    callSendAPI(user.id, response);
}

// Handles quick reply
function handleQuickReplies(user, quickRepliesEvent) {
    let response;
    let payload = quickRepliesEvent.payload;
    response = reply.handleReplyPayload(payload, user);

    // send the response
    callSendAPI(user.id, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response, persona) {
    // debug response
    console.log("Sending response: \n", util.inspect(response, false, null, true /* enable colors */));

    // constrcut the message body
    let request_body = 
    {
        "recipient": {"id": sender_psid},
        "message": response,
        "messaging-type": "RESPONSE"
    }

    if (persona) {
        request_body["persona_id"] = process.env.PERSONA_ID;
    }

    // send the POST request to the Messenger platform
    request(
        {
        "url": "https://graph.facebook.com/v7.0/me/messages",
        "qs": { "access_token": process.env.PAGE_ACCESS_TOKEN},
        "method": "POST",
        "json": request_body
        }, (err, res, body) => {
        if (err) {
            console.error("Unable to send message: " + err);
        }
    })
}

// get user profile info and respond.
function get_user_profile_then_respond(psid, event) {
    request(
        {
        "url": `https://graph.facebook.com/${psid}?fields=first_name,last_name,profile_pic&access_token=${process.env.PAGE_ACCESS_TOKEN}`,
        "method": "GET"
        }, (err, body) => {
            if (err) {
                console.error("User Profile API error");
            }
            else {
                let obj = JSON.parse(body.body);
                // debug
                console.log("User API returned: \n", util.inspect(obj, false, null, true /* enable colors */));

                // check if the event is a message or postback and pass the event to the appropiate handler function
                if (event.message) {
                    if (event.message.quick_reply) {
                        handleQuickReplies(obj, event.message.quick_reply);
                    }
                    else {
                        handleMessage(obj, event.message);
                    }
                }
                else if (event.postback) {
                    handlePostback(obj, event.postback);
                }
            }
        }
    )
}

exports.sendAPI = callSendAPI;
exports.persona = sendingAsPersona;