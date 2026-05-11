const showingService = require('../services/showing.service');

async function listShowings(req, res, next) {
  try {
    const showings = await showingService.listShowings(req.query);
    res.json(showings);
  } catch (err) {
    next(err);
  }
}

async function createShowing(req, res, next) {
  try {
    const showing = await showingService.createShowing(req.body);
    res.status(201).json(showing);
  } catch (err) {
    next(err);
  }
}

async function updateShowing(req, res, next) {
  try {
    const showing = await showingService.updateShowing(req.params.id, req.body);
    res.json(showing);
  } catch (err) {
    next(err);
  }
}

async function deleteShowing(req, res, next) {
  try {
    await showingService.deleteShowing(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { listShowings, createShowing, updateShowing, deleteShowing };
