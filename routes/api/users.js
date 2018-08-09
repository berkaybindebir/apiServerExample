const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');

// Load Input Validation
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

const Auth = require('../../config/isAuth');

// Load User Model
const User = require('../../models/User')

// GET api/users/register
// register
// access Public
router.post('/register', (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email})
    .then(user => {
      if(user) {
        errors.email = 'Email already exists'
        return res.status(400).json(errors);
      } else {
        const avatar = gravatar.url(req.body.email, {
          s: '200',
          r: 'pg',
          d: 'mm'
        });

        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          avatar,
          password: req.body.password
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if(err) console.log(err);
            newUser.password = hash;
            newUser.save()
              .then(user => res.json(user))
              .catch(err => console.log(err));
          })
        });
      }
    })
});

// GET api/users/login
// login User / Return Token
// access Public
router.post('/login', (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  const email = req.body.email;
  const password = req.body.password;

  User.findOne({email})
    .then(user =>{
      if(!user){
        errors.email = 'User not found!';
        return res.status(404).json(errors);
      }

      // Check Password
    bcrypt.compare(password, user.password).then(isMatch => {
      // User Matched
      if(isMatch){
        // User Matched
        const payload = { id: user.id, name: user.name, avatar: user.avatar } // Create Payload
        // Sign Token
        jwt.sign(
          payload,
          keys.secret,
          { expiresIn: 3600},
          (err, token) => {
            res.json({
              success: true,
              token: 'Bearer ' + token
            });
          })
      }else{
        errors.password = 'Password is not match!';
        return res.status(400).json(errors);
      }
    });
  });
});

// GET api/users/curent
// return current user
// access Private
router.get(
  '/current',
  passport.authenticate('jwt', {session: false}),
  (req, res) => {
    res.json(req.user);
  }
);

module.exports = router;
