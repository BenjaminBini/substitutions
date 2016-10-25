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

// When a tweet is received
stream.on('tweet', function (tweet) {
    console.log('New tweet received: ');
    console.log(tweet.text)
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
    // Tweet a reply if a modification happened
    if (newTweet != tweet.text) {
        console.log('Tweet has been modified: ');
        console.log(newTweet);
        var newTweet = '.@' + tweet.user.screen_name + ' ' + newTweet;
        if (newTweet.length <= 140) {
            T.post('statuses/update', {
                in_reply_to_status_id: tweet.id_str,
                status: newTweet
            }, function (err, data, response) {
                if (err) {
                    console.dir(err);
                }
                console.log('>>> Tweet sent');
                console.log();
            });
        } else {
            console.log('Tweet too long (' + newTweet.length + ' characters)');
        }
        /*
        // Tweet with a leading dot to display the tweet in everyone's timeline
        if (newTweet.length <= 141) {
            T.post('statuses/update', {
                status: '.' + newTweet
            }, function (err, data, response) {
                if (err) {
                    console.dir(err);
                }
                console.log('>>> Mention with a leading dot sent');
                console.log();
            })
        } else {
            console.log('Tweet too long to send a "dot mention" (' + newTweet.length + ' characters)');
        }
        */
    }
    console.log();
});
