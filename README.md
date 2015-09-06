# Yo Congress!

Yo Congress is a twitter bot that retweets tweets sent to @yocongress to the twitter
accounts of the congresspeople corresponding to the location of the tweet.

This is a work in progress.

## Specs

- Success: Tweet from capital of every state with location enabled tweets to senators and reps
- Error: Tweet received without a lat / lon get replied to with link to enable geolocation
- Error: Tweet outside of US get replied with "You don't seem to be in the US"
- Error: For tweet from state with rep with no handle, that rep is ignored
- Error: More than 10 tweets / 24 hrs per user gets blocked with message
