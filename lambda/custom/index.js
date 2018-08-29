/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require("ask-sdk-core");

const deckTypes = [
  "standard",
  "future",
  "frontier",
  "modern",
  "legacy",
  "pauper",
  "vintage",
  "penny",
  "commander",
  "1v1",
  "duel",
  "brawl"
];

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
        outputSpeech =
          outputSpeech +
          `I was unable to find the card ${card.replace(
            "+",
            " "
          )}. Please make sure you are requesting a valid Magic the Gathering card.`;
      });

    return handlerInput.responseBuilder
      .speak(outputSpeech)
      .reprompt(outputSpeech)
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

        const validDeckType = deckTypes.includes(mode);
        if (validDeckType) {
          const rule = legalities[mode].replace("_", " ");
          outputSpeech = `${name} is ${rule} in ${mode}.`;
        } else {
          outputSpeech =
            `I found ${name}, however, ${mode} is not a valid deck type. ` +
            ` Please try again with a valid deck type.` +
            ` Valid deck types are: ${deckTypes.join(", ")}`;
        }
      })
      .catch(err => {
        //set an optional error message here
        outputSpeech =
          outputSpeech +
          `I was unable to find the card ${card.replace(
            "+",
            " "
          )}. Please make sure you are requesting a valid Magic the Gathering card.`;
      });

    return handlerInput.responseBuilder
      .speak(outputSpeech)
      .reprompt(outputSpeech)
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
              outputSpeech =
                outputSpeech + `There are currently no rulings for ${name}`;
            }
          })
          .catch(rulings_err => {
            outputSpeech =
              outputSpeech +
              `I was able to locate the card ${name}, however, there seems to be an issue finding its rulings. It is safe to assume there are no rulings for this card.`;
          });
      })
      .catch(err => {
        //set an optional error message here
        outputSpeech = `I was unable to find the card ${card.replace(
          "+",
          " "
        )}. Please make sure you are requesting a valid Magic the Gathering card.`;
      });

    return handlerInput.responseBuilder
      .speak(outputSpeech)
      .reprompt(outputSpeech)
      .withStandardCard(title, outputSpeech, smallImageUrl, largeImageUrl)
      .getResponse();
  }
};

const IntroIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "LaunchRequest";
  },
  handle(handlerInput) {
    const speechText = "Welcome to Magic Rules!";

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
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
    const speechText =
      "What would you like help with? You can say, 'What can I do?' if you are unsure.";

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

const WhatCanIDoIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "WhatCanIDoIntent"
    );
  },
  handle(handlerInput) {
    const speechText =
      "Magic Rules allows you to check on legalities and rulings on Magic The Gathering Cards. " +
      "You can ask, 'what are the legalities for Diviner Spirit'. " +
      "This will list what decks this card is legal and illegal in. " +
      "You can ask, 'can I play Diviner Spirit in Standard'." +
      "This will tell you if the card is legal, illegal or banned in Standard." +
      "You can ask, 'what are the rulings for Diviner Spirit'. " +
      "This will list all the rules for the card.";

    const options =
      "You can ask 'what are the legalities for Diviner Spirit'. \n" +
      "You can ask 'can I play Diviner Spirit in Standard' \n" +
      "You can ask 'what are the rulings for Diviner Spirit'. ";

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard("What can I do?", options)
      .getResponse();
  }
};

const HowToListLegalitiesHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name ===
        "HowToListLegalitiesIntent"
    );
  },
  handle(handlerInput) {
    const speechText =
      "You can list the legalities for a card by saying: " +
      "'What are the legalities for Diviner Spirit', " +
      "where 'Diviner Spirit' is the name of the card you are interested in.";

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard("Legalities", speechText)
      .getResponse();
  }
};

const HowToCheckLegalityOfCardHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name ===
        "HowToCheckLegalityOfCardIntent"
    );
  },
  handle(handlerInput) {
    const speechText =
      "You can check if a card is legal for a deck by saying: " +
      "'is Black Lotus legal in standard', " +
      "where 'Black Lotus' is the name of the card you are interested in and standard is the deck type.";

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard("Legality for Card", speechText)
      .getResponse();
  }
};

const HowToListCardRulingsHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name ===
        "HowToListCardRulingsIntent"
    );
  },
  handle(handlerInput) {
    const speechText =
      "You can hear the rulings for a card by saying: " +
      "'What are the rulings for Diviner Spirit', " +
      "where 'Diviner Spirit' is the name of the card you are interested in.";

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard("Rulings", speechText)
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
    IntroIntentHandler,
    HelpIntentHandler,
    WhatCanIDoIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
