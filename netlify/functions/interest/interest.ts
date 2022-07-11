import {
  Handler
} from '@netlify/functions'
import {
  TypeformResponse,
  TypeformMultipleChoiceAnswer
} from "./typeform"

import buttondown from "buttondown"
import fetch from "node-fetch"
import * as crypto from "node:crypto"

type RegistrationTypeformAnswers = TypeformMultipleChoiceAnswer[]

type RegistrationTypeformResponse = Omit<TypeformResponse, 'answers'> & {
  answers: RegistrationTypeformAnswers
};

export const handler: Handler = async (event, context) => {

  function verifySignature(receivedSignature: string, payload: string){
    const hash = crypto
      .createHmac('sha256', process.env.TYPEFORM_TOKEN)
      .update(payload)
      .digest('base64')
    return receivedSignature === `sha256=${hash}`
  }
  
  if(verifySignature(event.headers['typeform-signature'], event.body.toString()) == false) {
    return {
      statusCode: 401,
      message: "Unauthorized"
    }
  }

  const body: RegistrationTypeformResponse = JSON.parse(event.body)
  // @ts-expect-error
  const answers: RegistrationTypeformAnswers = body.form_response.answers

  const interest_level = answers[0].choice.label

  buttondown.setApiKey(process.env.BUTTONDOWN_API_KEY);

  const subscriber = await buttondown.subscribers.list(1, {
    email: body.form_response.hidden.email
  });

  if(subscriber.length == 0) {

      const webhook = await fetch(process.env.SLACK_HOOKS_URL, {
        body: JSON.stringify({
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "Interest form - Random person",
                emoji: true
              }
            },
            {
              type: "divider"
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `A random person responded ${interest_level}`
              }
            }
          ]
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      })
      
      return {
        statusCode: 200
      }

  } else if (subscriber.length > 1) {
    const webhook = await fetch(process.env.SLACK_HOOKS_URL, {
        body: JSON.stringify({
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "Interest form - multiple entries",
                emoji: true
              }
            },
            {
              type: "divider"
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `${body.form_response.hidden.email} responded ${interest_level} but there are multiple entries in Buttondown with this email. \n Please clean this up`
              }
            }
          ]
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      })
    return {
      statusCode: 500,
      message: "Multiple Buttondown subscribers exist for that email."
    }
  }

  const webhook = await fetch(process.env.SLACK_HOOKS_URL, {
        body: JSON.stringify({
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "Interest form submission",
                emoji: true
              }
            },
            {
              type: "divider"
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Player(s) Name(s):* ${subscriber[0].metadata.players}`
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Email:* ${subscriber[0].email}`
              }
            },
            {
              type: "divider"
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Interest Level:* ${interest_level}`
              }
            }
          ]
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      })
  return {
    statusCode: 200
  }

}