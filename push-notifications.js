var webPush = require("web-push");

var pushSubscription = 
 {"endpoint":"https://fcm.googleapis.com/fcm/send/cmifDEnStwc:APA91bFatkW89AyDLIHp_k7m1YH4Tnl19itzCz1fYp2aBqY3gw4ZOIaoCE-57vOBBWkjmkB8scp8V_3M7KsAzTf_dfCzBGrbxH4j5O5WAVZaWNBeoE3nMwvXtQwETFKSyvSDYwp-g25X","keys":{"p256dh":"BAPzNmdshfnHsCcgzG9wBsKnQkeqOhKCJO0sSJVm3JyDvBX6-z93kZkMERicqaUe_H3cD0kiSphSGCXxYluJG9c","auth":"_nm0xMBfSSSr4Zeq8RCg9g"}};


var payload = "Here is a payload!";

var options = {
  //gcmAPIKey: "AIzaSyD1JcZ8WM1vTtH6Y0tXq_Pnuw4jgj_92yg",
  TTL: 60
};



webPush.setVapidDetails(
  "https://www.malu202.github.io/Antischwitzomat",
  //"BAPzNmdshfnHsCcgzG9wBsKnQkeqOhKCJO0sSJVm3JyDvBX6-z93kZkMERicqaUe_H3cD0kiSphSGCXxYluJG9c",
  //"6lCHCgNI63OIHMTraKS48TwhhDXGt3iM55gDIur6Yys"
  "BPpC0dcJVJWCBwjKNWPJW4o75bZpfiqUtGAU3Du18npgjqtCDqfWLMbHjIkMQAbDvcuPbP5eLfL9ZDSxilOFq0I",
  "6lCHCgNI63OIHMTraKS48TwhhDXGt3iM55gDIur6Yys"
);

module.exports.send = function(msg) {
  webPush.sendNotification(pushSubscription, payload).catch(function(e) {
    console.log(e);
  });
};
