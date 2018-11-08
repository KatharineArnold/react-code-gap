const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require("../models");

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    db.User.findById(id)
        .then(user => {
            done(null, user);
        });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
},
    (accessToken, refreshToken, profile, done) => {
        db.User.findOne({ googleId: profile.id })
            .then((existingUser) => {
                if (existingUser) {
                    done(null, existingUser);
                } else {
                    let imageUrl = null;
                    if (profile.photos.length) {
                        imageUrl = profile.photos[0].value;
                    }
                    new db.User({
                        googleId: profile.id,
                        givenName: profile.name.givenName,
                        familyName: profile.name.familyName,
                        imageURL: imageUrl,
                        address: ''
                    })
                        .save()
                        .then(newUser => {
                            done(null, newUser);
                        });
                }
            });
    }
)
);


router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/callback', passport.authenticate('google'), (req, res) => {
    res.redirect('/');
});

router.get('/current_user', (req, res) => {
    res.send(req.user);
});

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

module.exports = router;
