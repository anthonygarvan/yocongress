var Twitter = require('twitter');
var fs = require('fs')
var request = require('request');

var config = JSON.parse(fs.readFileSync('config.json', "utf8"));

var client = new Twitter({
  consumer_key: config.consumer_key,
  consumer_secret: config.consumer_secret,
  access_token_key: config.access_token_key,
  access_token_secret: config.access_token_secret
});

request.get('https://www.govtrack.us/api/v2/role?current=true&limit=600', function(err, result, body) {
    bioGuideIdToHandle = {};
    JSON.parse(body).objects.forEach(function(member) {
      bioGuideIdToHandle[member.person.bioguideid] = member.person.twitterid;
    })
})
