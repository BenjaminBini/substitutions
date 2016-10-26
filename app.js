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

// We tweet not more than every 5 minutes
var lastTweetTime = new Date();

// When a tweet is received
stream.on('tweet', function (tweet) {
    var newTweet = tweet.text;
    // Loop through the substitutions map and replace accordingly
    for (var [key, value] of substitutions.entries()) {
        const regEx = new RegExp('\\b' + key + '\\b', 'ig');
        let previousTweet = newTweet;
        newTweet = newTweet.replace(regEx, value.toLowerCase());
        if (newTweet != previousTweet) {
            console.log(key + ' => ' + value);
        }
    }
    // Tweet a reply if a modification happened and if the tweet is not from substitutions_ account
    if (newTweet != tweet.text && tweet.user.screen_name !== 'substitutions_') {
        console.log('@' + tweet.user.screen_name + ' ' + tweet.text);
        newTweet = '.@' + tweet.user.screen_name + ' ' + newTweet;
        console.log('=> ' + newTweet);
        if (newTweet.length <= 140 && new Date() - lastTweetTime > 1000 * 60 * 5) {
            T.post('statuses/update', {
                in_reply_to_status_id: tweet.id_str,
                status: newTweet
            }, function (err, data, response) {
                if (err) {
                    console.dir(err);
                }
                lastTweetTime = new Date();
                console.log('>>> Tweet sent');
                console.log();
            });
        } else {
            console.log('Tweet too long (' + newTweet.length + ' characters)');
        }
        console.log();
    }
});
