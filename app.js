var Twitter = require('twitter');
var fs = require('fs')
var request = require('request');
var YAML = require('yamljs');
var async = require('async');

var config = JSON.parse(fs.readFileSync('config.json', "utf8"));

/*
var dbPath = __dirname + '/tweetdb';
mkdirp(dbPath, function(err) {
  db = new Engine.Db(dbPath, {});
  collection = db.collection("tweets");
})
*/

var client = new Twitter({
  consumer_key: config.consumer_key,
  consumer_secret: config.consumer_secret,
  access_token_key: config.access_token_key,
  access_token_secret: config.access_token_secret
});

function getLegislatorRoles() {
  request.get('https://www.govtrack.us/api/v2/role?current=true&limit=600', function(err, result, body) {
      bioGuideIdToHandle = {};
      JSON.parse(body).objects.forEach(function(member) {
        bioGuideIdToHandle[member.person.bioguideid] = member.person.twitterid;
      })
  })
}

function getRepDictionaries(callback) {
  request.get('https://raw.githubusercontent.com/unitedstates/congress-legislators/master/legislators-current.yaml',
        function(err, result, body) {
          senators = {};
          reps = {};
          legislators = YAML.parse(body);
          legislators.forEach(function(legislator) {
            term = legislator.terms[legislator.terms.length -1]
            if(term.type === 'sen') {
                if(term.state in senators) {
                  senators[term.state].push(legislator.id.bioguide);
                } else {
                  senators[term.state] = [legislator.id.bioguide];
                }
            }

            if(term.type === 'rep') {
              districtKey = term.state + '-' + term.district;
              reps[districtKey] = legislator.id.bioguide;
            }
          })
  });
}

function getNewMentions(callback) {
    client.get('statuses/mentions_timeline', function(err, tweets, response) {
      callback(null, tweets);
    });
}

function getRepTwitterHandles(tweet, callback) {
  if(tweet.place) {
    var lon = tweet.place.bounding_box.coordinates[0][0][0];
    var lat = tweet.place.bounding_box.coordinates[0][0][1];
    url = 'https://gis.govtrack.us/boundaries/cd-2012/?contains=LAT,LON&format=json'
    url = url.replace('LAT', lat.toString());
    url = url.replace('LON', lon.toString());
    request.get(url, function(err, result, body) {
      boundary = JSON.parse(body);
      district = boundary.objects[0].name;
      state = district.split('-')[0];

      allReps = senators[state]
      allReps.push(reps[district]);
      twitterHandles = []
      allReps.forEach(function(rep) {
        twitterHandles.push(bioGuideIdToHandle[rep]);
      });
      callback(null, tweet, twitterHandles);
    })
  } else {
    callback(null, tweet, []);
  }

}

function composeTweet(tweet, twitterHandles, callback) {
      var retweet = {status: '@' + tweet.user.screen_name + ' '};
      if(twitterHandles.length > 0) {
          console.log(tweet);
          retweet.status += '+ ';
          retweet.in_reply_to_status_id = tweet.id;
          twitterHandles.forEach(function(handle) {
            retweet.status += '@' + handle +'_test ';
          })
          retweet.status += 'https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str;
          retweet.place_id = tweet.place.id;
      } else {
        if(!tweet.place) {
          retweet.status += 'Sorry, you have to enable location for this to work. To learn how visit https://support.twitter.com/articles/122236';
        } else {
          retweet.status += 'Sorry, I couldn\'t find your representatives. You must be located in the US for this to work. If you think it\'s a bug, please tweet to me again with hashtag #bug';
        }
      }

      callback(null, retweet);
}

function sendTweet(tweet, callback) {
  client.post('statuses/update', tweet, function(err, tweet, response) {
    callback(null, tweet.text);
  })
}

// Flow control

function retweetToReps(tweet, callback) {
  async.waterfall([function(callback) {callback(null, tweet)}, getRepTwitterHandles, composeTweet, sendTweet],
    function(err, result) {
        console.log(result);
        callback(err);
    })
}

function distributeTweets(tweets, callback) {
  async.eachSeries(tweets, retweetToReps, function(err) {
      callback(null, 'done');
  });
}

function retweetAll() {
  async.waterfall([getNewMentions, distributeTweets], function(err, result) {
    console.log(result);
  })
}

getLegislatorRoles();
getRepDictionaries();
setTimeout(retweetAll, 5000);
