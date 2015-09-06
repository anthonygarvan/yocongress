var Twitter = require('twitter');
var fs = require('fs')
var request = require('request');
var YAML = require('yamljs');

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

function getBoundary(lat, lon) {
  url = 'https://gis.govtrack.us/boundaries/cd-2012/?contains=LAT,LON&format=json'
  url = url.replace('LAT', lat.toString());
  url = url.replace('LON', lon.toString());
  request.get(url, function(err, result, body) {
    boundary = JSON.parse(body);
    district = boundary.objects[0].name;
    state = district.split('-')[0];

    allReps = senators[state]
    allReps.push(reps[district]);
    console.log(allReps);
    twitterHandles = []
    allReps.forEach(function(rep) {
      twitterHandles.push(bioGuideIdToHandle[rep]);
    });
    console.log(twitterHandles);
  })
}

function getBioGuidesFromDistrictMappings(callback) {
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

          getBoundary(37, -90);
        });
}



getBioGuidesFromDistrictMappings();
