# Yo Congress!

Yo Congress is a twitter bot that retweets tweets sent to @YoCongress to the
right member of the house, replacing the mention of @YoCongress with
that of the representative.

For Example, the tweet:
@YoCongress, lower taxes!

Becomes:
@janschakowsky, lower taxes!

From Evanston, Illinois.

Location needs to be enabled for it to work, to enable location on your device
see [here](https://support.twitter.com/articles/122236).

Due to API limitations it can take up to a minute to retweet to your rep.

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

- Success: New tweet with mention of @YoCongress replaced with mention of congressperson.
- Success: Works with both "places" api and specific location [not implemented]
- Error: Tweet received without a lat / lon get replied to with link to enable geolocation
- Error: Tweet outside of US get replied with "You don't seem to be in the US"
- Error: For tweet from state with rep with no handle, that rep is ignored

## Other Info

- Members of congress can opt out of this service by tweeting to @YoCongress
with hashtag @optout.
- The behavior of this bot is a little strange (i.e., not simply retweeting to congresspeople)
because it is very easy to get flagged as spam by twitter. This is my best attempt
to provide rich tweets compliant with twitter's rules & regulations.
