const express = require('express');
const router = express.Router();
const auth = require('../middleware/authenticate');
const { getBoard, getTasksByBoard, updateBoard, deleteBoard } = require('../controllers/boardController');

// GET  /api/boards/:boardId          — view specific board
router.get('/:boardId', auth, getBoard);

// GET  /api/boards/:boardId/tasks    — view all tasks in board
router.get('/:boardId/tasks', auth, getTasksByBoard);

// PATCH /api/boards/:boardId         — update board name
router.patch('/:boardId', auth, updateBoard);

// DELETE /api/boards/:boardId        — delete board + tasks
router.delete('/:boardId', auth, deleteBoard);

module.exports = router;
