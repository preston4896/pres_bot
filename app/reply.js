"strict mode";

// debug
const util = require("util");
const attachment = require("./attachment");

/**
 * Handles quick reply payload and generate response.
 * @param {string} payload
 * @returns {object} : response based on payload.
 */
function handleReplyPayload(payload) {
    if (payload == "talk") {
        return{
            "text": "Cool! I am a great listener. What would you like to talk about?",
            "quick_replies": [
                {
                    "content_type": "text",
                    "title": "Get to know Preston!",
                    "payload": "intro"
                },
                {
                    "content_type": "text",
                    "title": "Hire Preston!",
                    "payload": "hire"
                }
            ]
        }
    }
    else if (payload == "bye") {
        return{
            "text": "Ok. Goodbye! 👋"
        }
    }
    else if (payload == "hire") {
        return{
            "attachment":
            {
                "type": "template",
                "payload":
                {
                    "template_type": "generic",
                    "elements": [
                        {
                            "title": "Hire me!",
                            "subtitle": "I recently graduated from UC Davis. Seeking full-time position in software engineering. Check out my website and portfolio! :)",
                            "image_url": "https://raw.githubusercontent.com/preston4896/preston4896.github.io/master/assets/headshot.png",
                            "buttons" : [
                                {
                                    "type": "web_url",
                                    "url": "https://prestonongis.online/",
                                    "title" : "Website"
                                },
                                {
                                    "type" : "web_url",
                                    "url" : "http://github.com/preston4896",
                                    "title" : "GitHub"
                                },
                                {
                                    "type": "web_url",
                                    "url": "http://linkedin.com/in/prestonong",
                                    "title": "LinkedIn"
                                }
                            ]
                        }
                    ]
                }
            }
        }
    }
    else if (payload == "intro") {
        return{
            "text": "Hello! My name is Preston Ong. That's it for now. I will do a better job at introducing myself in the future. :P"
        }
    }
}

exports.handleReplyPayload = handleReplyPayload;