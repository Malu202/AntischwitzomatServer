var webPush = require("web-push");


webPush.setVapidDetails(
  "https://www.malu202.github.io/Antischwitzomat",
  "BPpC0dcJVJWCBwjKNWPJW4o75bZpfiqUtGAU3Du18npgjqtCDqfWLMbHjIkMQAbDvcuPbP5eLfL9ZDSxilOFq0I",
  "6lCHCgNI63OIHMTraKS48TwhhDXGt3iM55gDIur6Yys"
);

module.exports.send = function (msg, pushSubscription, voltageNotification) {
  let options = {
    headers: {
      "Urgency": "high"
    }
  }
  if (!voltageNotification) options.TTL = 3600;
  webPush.sendNotification(pushSubscription, msg, options).catch(function (e) {
    console.log("Push notification could not be sent:")
    console.log('"' + msg + '"');
    console.log(e);
  });
};