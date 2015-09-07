# Yo Congress!

Yo Congress is a twitter bot that retweets tweets sent to @YoCongress to the twitter
accounts of the congresspeople corresponding to the location of the tweet.

This is a work in progress.

## Operation

- Initialize:
  - getLegislatorRoles: this is used for mapping bioguide Ids -> twitter handles
  - getRepDictionaries: this is used for mapping district / state Ids -> bioguide ids
- Main loop:
  - getNewMentions
  - getRepTwitterHandles
  - composeTweet
  - [async] sendTweet

## Specs

- Success: Tweet from capital of every state with location enabled tweets to senators and reps
- Success: Works with both "places" api and specific location
- Error: Tweet received without a lat / lon get replied to with link to enable geolocation
- Error: Tweet outside of US get replied with "You don't seem to be in the US"
- Error: For tweet from state with rep with no handle, that rep is ignored
- Error: More than 10 tweets / 24 hrs per user gets blocked with message
