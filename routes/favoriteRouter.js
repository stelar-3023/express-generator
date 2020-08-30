const express = require("express");
const bodyParser = require("body-parser");
const Favorite = require("../models/favorite");
const authenticate = require("../authenticate");
const cors = require("./cors");
const { Router, response } = require("express");

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Favorite.find()
      .populate("campsites user")
      .then((favorites) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(favorites);
      })
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id })
      .then((favorite) => {
        if (favorite) {
          req.body.forEach((fav) => {
            if (!favorite.campsites.includes(fav._id)) {
              favorite.campsites.push(fav._id);
            }
          });
          favorite
            .save()
            .then((favorite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorite);
            })
            .catch((err) => next(err));
        } else {
          Favorite.create({
            user: req.user._id,
            campsites: req.body,
          })
            .then((favorite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorite);
            })
            .catch((err) => next(err));
        }
      })
      .catch((err) => next(err));
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.send("PUT operation not supported on /favorites");
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOneAndDelete({ user: req.user._id })
      .then((response) => {
        res.statusCode = 200;
        res.json(response);
      })
      .catch((err) => next(err));
  });

favoriteRouter
  .route("/:campsiteId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(
      `GET operation not supported on /favorites/${req.params.campsiteId}`
    );
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id })
      .then((favorite) => {
        if (!favorite) {
          Favorite.create({
            user: req.user._id,
            campsites: [{ _id: req.params.campsiteId }],
          }).then((favorite) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorite);
          });
        } else if (!favorite.campsites.includes(req.params.campsiteId)) {
          favorite.campsites.push(req.params.campsiteId);
          favorite.save().then((favorite) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorite);
          });
        } else {
          res.send("That campsite is already in the list of favorites!");
        }
      })
      .catch((error) => next(err));
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.send(
      `PUT operation is not supported on /favorite/${req.params.campsiteId}`
    );
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id })
      .then((favorite) => {
        if (!favorite) {
          res.end("There was no favorite found.");
        }
        const campsites = favorite.campsites.filter(
          (favorite) => !favorite.equals(req.params.campsiteId)
        );
        favorite.campsites = campsites;
        favorite.save().then((favorite) => {
          res.json(favorite);
        });
      })
      .catch((err) => next(err));
  });

module.exports = favoriteRouter;
