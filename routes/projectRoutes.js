const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authenticate');
const { getProjects, getProject, createProject, updateProject} = require('../controllers/projectController');

// Projects CRUD
router.get('/',                        auth, getProjects);
router.post('/',                       auth, createProject);
router.get('/:projectId',              auth, getProject);
router.patch('/:projectId',            auth, updateProject);


module.exports = router;
