# Yo Congress!

Yo Congress is a twitter bot that retweets tweets sent to @YoCongress to the twitter
accounts of the congresspeople (members of the US senate and house of representatives)
corresponding to the location of the tweet.

Location needs to be enabled for it to work, to enable location on your device
see [here](https://support.twitter.com/articles/122236).

Due to API limitations it can take up to a minute to retweet to your reps.

## Operation

- Initialize:
  - getLegislatorRoles: this is used for mapping bioguide Ids -> twitter handles
  - getRepDictionaries: this is used for mapping district / state Ids -> bioguide ids
- Main loop:
  - getNewMentions
  - getRepTwitterHandles
  - composeTweet
  - sendTweet

## Specs

- Success: Tweet from location within US tweets to senators and reps
- Success: Works with both "places" api and specific location [not implemented]
- Error: Tweet received without a lat / lon get replied to with link to enable geolocation
- Error: Tweet outside of US get replied with "You don't seem to be in the US"
- Error: For tweet from state with rep with no handle, that rep is ignored

## Other Info

- Members of congress can opt out of this service by tweeting to @YoCongress
with hashtag @optout.
