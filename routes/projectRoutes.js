const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authenticate');
const { getProjects, getProject, createProject, updateProject, deleteProject, getProjectStats} = require('../controllers/projectController');
const { getBoardsByProject, createBoard } = require('../controllers/boardController');

// Projects CRUD
router.get('/',                        auth, getProjects);
router.post('/',                       auth, createProject);
router.get('/:projectId',              auth, getProject);
router.patch('/:projectId',            auth, updateProject);
router.delete('/:projectId',           auth, deleteProject);
router.get('/:projectId/stats',        auth, getProjectStats);

// GET  /api/projects/:projectId/boards   — view all boards in project
router.get('/:projectId/boards',       auth, getBoardsByProject);

// POST /api/projects/:projectId/boards   — create board in project
router.post('/:projectId/boards',      auth, createBoard);

module.exports = router;
