var Twitter = require('twitter');
var fs = require('fs')
var request = require('request');
var YAML = require('yamljs');
var async = require('async');

var config = JSON.parse(fs.readFileSync('config.json', "utf8"));
var processedTweets = {};

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
    client.get('statuses/mentions_timeline', {count: 100},
    function(err, tweets, response) {
      if(err) {
        console.log(err);
        callback(null, []);
      } else {
        filteredTweets = [];
        var recentTweetIds = {};
        tweets.forEach(function(tweet) {
          recentTweetIds[tweet.id_str] = new Date();
          if(!tweet.retweet_status
            && tweet.user.screen_name !== 'YoCongress'
            && !(tweet.id_str in processedTweets)) {
              filteredTweets.push(tweet);
          }
        })

        Object.keys(processedTweets).forEach(function(processedId) {
          if(!(processedId in recentTweetIds)) {
            delete processedTweets[processedId];
          }
        })

        console.log(filteredTweets.length + ' new mentions found');
        callback(null, filteredTweets);
      }
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
      if(boundary.objects.length > 0) {
        district = boundary.objects[0].name;
        state = district.split('-')[0];

        var allReps = []
        senators[state].forEach(function(senator) {
          allReps.push(senator);
        })
        allReps.push(reps[district]);

        var twitterHandles = []
        allReps.forEach(function(rep) {
          if(bioGuideIdToHandle[rep]) {
            twitterHandles.push(bioGuideIdToHandle[rep]);
          }
        });
        callback(null, tweet, twitterHandles);
      } else {
        callback(null, tweet, []);
      }
    })
  } else {
    callback(null, tweet, []);
  }

}

function composeTweet(tweet, twitterHandles, callback) {
      var retweet = {status: '@' + tweet.user.screen_name + ' '};
      retweet.in_reply_to_status_id = tweet.id_str;
      if(twitterHandles.length > 0) {
          retweet.status += '+ ';
          twitterHandles.forEach(function(handle) {
            retweet.status += '@' + handle + ' ';
          })
          retweet.status += 'https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str;
          retweet.place_id = tweet.place.id;
      } else {
        retweet.status = "";
      }
      processedTweets[tweet.id_str] = new Date();
      callback(null, retweet);
}

function sendTweet(tweet, callback) {
  if(tweet.status !== "") {
    client.post('statuses/update', tweet, function(err, tweet, response) {
      if(err) {console.log(err);}
      callback(null, tweet.text);
    });
  }
}

function deleteTweet(tweet, callback) {
  client.post('statuses/destroy/' + tweet.id_str + '.json', {}, function(err, tweets) {
    console.log(err);
    callback();
  });
}

// Flow control

function retweetToReps(tweet, callback) {
  async.waterfall([function(callback) {callback(null, tweet)}, getRepTwitterHandles, composeTweet, sendTweet],
    function(err, result) {
        callback(err);
    })
}

function distributeTweets(tweets, callback) {
  async.eachSeries(tweets, retweetToReps, function(err) {
      callback(null, 'done');
  });
}

function deleteTweets(tweets, callback) {
  async.eachSeries(tweets, deleteTweet, function(err) {
      callback(null, 'done');
  });
}

function retweetAll() {
  async.waterfall([getNewMentions, distributeTweets], function(err, result) {
    if(err) {console.log(err);}
    console.log('loop finished at ' + new Date());
  })
}

function deleteAll() {
  async.waterfall([getNewMentions, deleteTweets], function(err, result) {
    console.log(result);
  })
}

function startFresh() {
  async.waterfall([getNewMentions, function(tweets) {
    tweets.forEach(function(tweet) {
      processedTweets[tweet.id_str] = new Date();
    })
  }])
}

getLegislatorRoles();
getRepDictionaries();
startFresh();

// run bot in endless loop
setInterval(retweetAll, 65000);
