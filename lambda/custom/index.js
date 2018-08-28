/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require("ask-sdk-core");

const GetLegalitiesHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name ===
        "ListCardLegalitiesIntent"
    );
  },
  async handle(handlerInput) {
    let outputSpeech = "";
    let title = "";
    let content = "";
    let smallImageUrl = "";
    let largeImageUrl = "";

    const card = handlerInput.requestEnvelope.request.intent.slots.cardName.value
      .toLowerCase()
      .replace(" ", "+");

    await getRemoteData(`https://api.scryfall.com/cards/named?fuzzy=${card}`)
      .then(response => {
        const data = JSON.parse(response);
        const name = data.name;
        const legalities = data.legalities;
        smallImageUrl = data.image_uris.small;
        largeImageUrl = data.image_uris.large;

        outputSpeech = `The legalities for ${data.name} are as follows: `;
        Object.keys(legalities).map(function(mode, index) {
          outputSpeech =
            outputSpeech +
            `${name} is ${legalities[mode].replace("_", " ")} in ${mode},`;
        });
      })
      .catch(err => {
        //set an optional error message here
        outputSpeech = err.message;
      });

    return handlerInput.responseBuilder
      .speak(outputSpeech)
      .withStandardCard(
        "Legalities",
        outputSpeech,
        smallImageUrl,
        largeImageUrl
      )
      .getResponse();
  }
};

const CardLegalitiesHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "CardLegalityIntent"
    );
  },
  async handle(handlerInput) {
    let outputSpeech = "";
    let title = "";
    let content = "";
    let smallImageUrl = "";
    let largeImageUrl = "";

    const card = handlerInput.requestEnvelope.request.intent.slots.cardName.value
      .toLowerCase()
      .replace(" ", "+");
    const mode = handlerInput.requestEnvelope.request.intent.slots.mode.value.toLowerCase();

    await getRemoteData(`https://api.scryfall.com/cards/named?fuzzy=${card}`)
      .then(response => {
        const data = JSON.parse(response);
        const name = data.name;
        const legalities = data.legalities;
        title = name;
        smallImageUrl = data.image_uris.small;
        largeImageUrl = data.image_uris.large;

        const rule = legalities[mode].replace("_", " ");
        outputSpeech = `${data.name} is ${rule} in ${mode}`;
      })
      .catch(err => {
        //set an optional error message here
        outputSpeech = err.message;
      });

    return handlerInput.responseBuilder
      .speak(outputSpeech)
      .withStandardCard(title, outputSpeech, smallImageUrl, largeImageUrl)
      .getResponse();
  }
};

const GetCardRulingsHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "CardRulingsIntent"
    );
  },
  async handle(handlerInput) {
    let outputSpeech = "";
    let title = "";
    let content = "";
    let smallImageUrl = "";
    let largeImageUrl = "";

    const card = handlerInput.requestEnvelope.request.intent.slots.cardName.value
      .toLowerCase()
      .replace(" ", "+");

    await getRemoteData(`https://api.scryfall.com/cards/named?fuzzy=${card}`)
      .then(async response => {
        const data = JSON.parse(response);
        const name = data.name;
        const rulings_uri = data.rulings_uri;
        title = name;

        await getRemoteData(rulings_uri)
          .then(json => {
            const rulings_data = JSON.parse(json);
            const rulings = rulings_data.data;
            smallImageUrl = data.image_uris.small;
            largeImageUrl = data.image_uris.large;

            if (rulings.length > 0) {
              outputSpeech = `The rulings for ${name} are as follows: \n`;

              rulings.map(function(rule) {
                outputSpeech =
                  outputSpeech +
                  ` ${rule["source"]} ${rule["object"]} on ${
                    rule["published_at"]
                  }: ${rule["comment"]} \n`;
              });
            } else {
              outputSpeech = `There are currently no rulings for ${card}`;
            }
          })
          .catch(rulings_err => {
            outputSpeech = rulings_err.message;
          });
      })
      .catch(err => {
        //set an optional error message here
        outputSpeech = err.message;
      });

    return handlerInput.responseBuilder
      .speak(outputSpeech)
      .withStandardCard(title, outputSpeech, smallImageUrl, largeImageUrl)
      .getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const speechText = "You can introduce yourself by telling me your name";

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      (handlerInput.requestEnvelope.request.intent.name ===
        "AMAZON.CancelIntent" ||
        handlerInput.requestEnvelope.request.intent.name ===
          "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    const speechText = "Goodbye!";

    return handlerInput.responseBuilder.speak(speechText).getResponse();
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "SessionEndedRequest";
  },
  handle(handlerInput) {
    console.log(
      `Session ended with reason: ${
        handlerInput.requestEnvelope.request.reason
      }`
    );

    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak("Sorry, I can't understand the command. Please say again.")
      .reprompt("Sorry, I can't understand the command. Please say again.")
      .getResponse();
  }
};

const getRemoteData = function(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? require("https") : require("http");
    const request = client.get(url, response => {
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(new Error("Failed with status code: " + response.statusCode));
      }
      const body = [];
      response.on("data", chunk => body.push(chunk));
      response.on("end", () => resolve(body.join("")));
    });
    request.on("error", err => reject(err));
  });
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    GetLegalitiesHandler,
    CardLegalitiesHandler,
    GetCardRulingsHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
