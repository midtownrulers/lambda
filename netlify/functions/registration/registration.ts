import {
  Handler
} from '@netlify/functions'
import {
  TypeformResponse,
  TypeformEmailAnswer,
  TypeformPaymentAnswer
} from "./typeform"

import buttondown from "buttondown"
import fetch from "node-fetch"

type RegistrationTypeformAnswers = [TypeformEmailAnswer, TypeformPaymentAnswer]

type RegistrationTypeformResponse = Omit<TypeformResponse, 'answers'> & {
  answers: RegistrationTypeformAnswers
};

export const handler: Handler = async (event, context) => {
  const body: RegistrationTypeformResponse = JSON.parse(event.body)
  // @ts-expect-error
  const answers: RegistrationTypeformAnswers = body.form_response.answers
  console.log(answers[0].email)

  buttondown.setApiKey(process.env.BUTTONDOWN_API_KEY);

  const subscriber = await buttondown.subscribers.list(1, {
    email: answers[0].email
  });


  if(subscriber.length == 0) {
    try {
      const createdSubscriber = await buttondown.subscribers.create({
        email: answers[0].email,
        tags: ["Spring 2022 Reg'd"]
      });

      const webhook = await fetch(process.env.SLACK_HOOKS_URL, {
        body: JSON.stringify({
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "Registration form - Update Buttondown",
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
                text: `${answers[0].email} has successfully registered but there were no entries for this email in Buttondown. \n We created an entry in Buttondown *but you need to fill out all other metadata.*`
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

    } catch(e) {
      const webhook = await fetch(process.env.SLACK_HOOKS_URL, {
        body: JSON.stringify({
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "Registration form - Something went wrong",
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
                text: "Something went wrong when adding an *unknown* user to Buttondown."
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
        message: "Something went wrong when adding an *unknown* user to Buttondown."
      }
    }    
  } else if (subscriber.length > 1) {
    const webhook = await fetch(process.env.SLACK_HOOKS_URL, {
        body: JSON.stringify({
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "Registration form - Something went wrong",
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
                text: `${answers[0].email} has successfully registered but there are multiple entries in Buttondown with this email. \n Please clean this up, and **manually add the registered tag**.`
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

  const subscriberId = subscriber[0].id
  try {
    await buttondown.subscribers.patch(subscriberId, {
      tags: ["Spring 2022 Reg'd"]
    });
  } catch(e) {
    const webhook = await fetch(process.env.SLACK_HOOKS_URL, {
        body: JSON.stringify({
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "Registration form - Something went wrong",
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
                text: `${answers[0].email} has successfully registered but we were unable to update the Buttondown tags. *Please do this manually.*`
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
      message: "Unable to update Buttondown tags"
    }
  }

  const webhook = await fetch(process.env.SLACK_HOOKS_URL, {
        body: JSON.stringify({
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "Successful Registration!",
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
                text: "They have successfully registered, and we have updated the tags in Buttondown."
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