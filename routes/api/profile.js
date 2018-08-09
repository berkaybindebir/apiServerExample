const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

const validateProfileInput = require('../../validation/profile');

const Profile = require('../../models/Profile');
const Users = require('../../models/Users');

const Auth = require('../../config/isAuth');

/**
 * @route Get api/profile
 * @desc Get current users profile
 * @access Private
 */
router.get(
  '/',
  Auth,
  (req, res) => {
  const errors = {};

  Profile.findOne({ user: req.user.id})
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        return res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

/**
 * @route Get api/profile/user/:id
 * @desc  Get profile by id
 * @access Public
 */
router.get('/user/:user_id', (req, res) => {
  const errors = {};

  Profile.findOne({ handle: req.params.user_id })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        res.status(404).json(errors)
      }

      res.json(200).json(profile)
    })
    .catch(err => res.status(404).json({profile: 'There is no profile'}));
});

/**
 * @route Get api/profile/all
 * @desc  Get All Profiles
 * @access Public
 */
router.get('/all', (req, res) => {
  const errors = {};

  Profile.find()
  .populate('user', ['name', 'avatar'])
  .then(profiles => {
    if(!profiles) {
      errors.noprofile = 'There are no profiles'
      return res.status(404).json(errors);
    }

    res.json(profiles);
  })
  .catch(
    err => res.status(404).json({ profile: 'There are no profiles' })
  );
});

/**
 * @route Get api/profile/handle/:handle
 * @desc  Get profile by handle
 * @access Public
 */
router.get('/handle/:handle', (req, res) => {
  const errors = {};

  Profile.findOne({ handle: req.params.handle })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        res.status(404).json(errors)
      }

      res.json(200).json(profile)
    })
    .catch(err => res.status(404).json(err));
});

/**
 * @route POST api/profile
 * @desc Post current users profile
 * @access Private
 */
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validateProfileInput(req.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }
    const profileFields = {};

    profileFields.user = req.user.id;
    if(req.body.handle) profileFields.handle = req.body.handle;
    if(req.body.company) profileFields.company = req.body.company;
    if(req.body.website) profileFields.website = req.body.website;
    if(req.body.location) profileFields.location = req.body.location;
    if(req.body.bio) profileFields.bio = req.body.bio;
    if(req.body.status) profileFields.status = req.body.status;
    if(req.body.githubusername) profileFields.githubusername = req.body.githubusername;
    // Skills - split into array
    if (typeof req.body.skills !== 'undefined') {
      profileFields.skills = req.body.skills.split(',');
    };
    // Social
    profileFields.social = {};
    if(req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if(req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if(req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
    if(req.body.instagram) profileFields.social.instagram = req.body.instagram;

    Profile.findOne({ user: req.user.id})
      .then(profile => {
        if (profile) {
          // Update
          Profile.findOneAndUpdate(
            { user: req.user.id},
            { $set: profileFields},
            {new: true}
          ).then(profile => res.json(profile));
        }else {
          // Create

          // Check if handle exists
          Profile.findOne({ handle: profileFields.handle }).then(profile => {
            if (profile) {
              errors.handle = 'That handle already exists'
              res.status.json(errors)
            }

            //Save Profile
            new Profile(profileFields).save().then(profile => res.json(profile))
          })
        }
      })
});

module.exports = router;
