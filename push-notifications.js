var webPush = require("web-push");
//var pushSubscription = {"endpoint":"https://fcm.googleapis.com/fcm/send/c-aUU2mFfCY:APA91bET1crSpJu5KDvjUoss6gFYnFNg6x4O4DW01CcJua-PdLKTHzwjZ61zS8OywryKxV7eKl04o7FIWwoXAao3rjjTJgo_mM_9jr2FvlptbUDMrBxU-ED4fln8xVzNHurGy3Rtb7yQ","expirationTime":null,"keys":{"p256dh":"BPHwOiBv2S1UgoX2Dy_MYSqf6_gwqGSyZclJgT_8YnVpt3XXaMT91gB0nRPVPHE7QuUZfvjwTsIoHw-YpCgoB9s","auth":"kM8pltWW60lE25O6QPjiQA"}};



var options = {
  //gcmAPIKey: "AIzaSyD1JcZ8WM1vTtH6Y0tXq_Pnuw4jgj_92yg",
  TTL: 60
};

webPush.setVapidDetails(
  "https://www.malu202.github.io/Antischwitzomat",
  "BPpC0dcJVJWCBwjKNWPJW4o75bZpfiqUtGAU3Du18npgjqtCDqfWLMbHjIkMQAbDvcuPbP5eLfL9ZDSxilOFq0I",
  "6lCHCgNI63OIHMTraKS48TwhhDXGt3iM55gDIur6Yys"
);

module.exports.send = function (msg, pushSubscription) {
  webPush.sendNotification(pushSubscription, msg, {
    headers: {
      "Urgency": "high"
    },
    TTL: 3600
  }).catch(function (e) {
    console.log(e);
  });
};