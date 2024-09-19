const express = require('express');
const Job = require('../models/Jobs');

const router = express.Router();

router.post('/jobs', async (req, res) => {
    const newJob = await Job.create(req.body);
    res.status(201).json(newJob);
});

router.get('/jobs', async (req, res) => {
    const jobs = await Job.findAll();
    res.status(200).json(jobs);
});

module.exports = router;