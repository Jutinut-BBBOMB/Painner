const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authenticate');
const { getTask, editTask, deleteTask } = require('../controllers/taskController');

// GET    /api/tasks/:taskId   — view specific task
router.get('/:taskId',    auth, getTask);

// PUT    /api/tasks/:taskId   — edit task (CS367)
router.put('/:taskId',    auth, editTask);

// DELETE /api/tasks/:taskId   — delete task
router.delete('/:taskId', auth, deleteTask);

module.exports = router;
