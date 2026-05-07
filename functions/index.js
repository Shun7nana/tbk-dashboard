const functions = require("firebase-functions");

exports.sendDiscordNotification =
functions.firestore
  .document("logs/{logId}")
  .onCreate(async (snap, context) => {

    const data = snap.data();

    const webhookUrl =
      "https://discordapp.com/api/webhooks/1501764757923954731/LfAp28fS8c7vwEVh8gx16OaiPq4yq-haLcJXv9L7sSeaY1QOYd6m2TDt3b_ppVCpyJ6R";

    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `📢 ${data.text}`,
      }),
    });

    return null;
  });