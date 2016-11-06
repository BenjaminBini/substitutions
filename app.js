// Twit library
const Twit = require('twit')

// Initialize dotenv for configuration file
require('dotenv').config();

// Substitutions
const substitutions = require('./substitutions');

// Add timestamp to console log
require("console-stamp")(console);

// Twit library client
const T = new Twit({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.TOKEN_KEY,
    access_token_secret: process.env.TOKEN_SECRET,
    timeout_ms: 60 * 1000,
});

// Initialize stream API
const stream = T.stream('user');

/**
 * We're going to post the tweet with the most substitutions in the last substitutions
 */

// We store the tweet with the most substitutions and the number of substitutions
var bestTweet;
var bestTweetReplyTo;
var bestSubstitutionsCount = 0;

// Tweet every 5 minutes
setInterval(tweet, 1000 * 60 * 5);

function tweet() {
    if (!!bestTweet) {
        T.post('statuses/update', {
            in_reply_to_status_id: bestTweetReplyTo,
            status: bestTweet
        }, function (err, data, response) {
            if (err) {
                console.dir(err);
            }
            console.log('>>> Tweet sent');
            console.log();
        });
    }
    // Reset the best tweet data
    bestTweet = undefined;
    bestTweetReplyTo = undefined;
    bestSubstitutionsCount = 0;
}

// When a tweet is received, we save the data necessary to post it if this is the one with the most substitutions
stream.on('tweet', function (tweet) {
    var newTweet = tweet.text;
    var substitutionsCount = 0;
    // Loop through the substitutions map and replace accordingly
    for (var [key, value] of substitutions.entries()) {
        const regEx = new RegExp('\\b' + key + '\\b', 'ig');
        let previousTweet = newTweet;
        newTweet = newTweet.replace(regEx, value.toLowerCase());
        if (newTweet != previousTweet) {
            substitutionsCount++;
        }
    }
    // Save the tweet to post if the tweet is valid, not from substitutions_ account and the one with the most substitutions
    if (substitutionsCount > bestSubstitutionsCount 
            && newTweet != tweet.text 
            && tweet.user.screen_name !== 'substitutions_') {
        newTweet = '.@' + tweet.user.screen_name + ' ' + newTweet;
        if (newTweet.length <= 140) {
            bestTweetReplyTo = tweet.id_str;
            bestTweet = newTweet;
            bestSubstitutionsCount = substitutionsCount;
        }
    }
});
