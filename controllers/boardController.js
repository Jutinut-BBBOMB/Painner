const mongoose = require('mongoose');
const { Board, Task } = require('../models');

// ── GET /api/boards/:boardId ─────────────────────────────────────────────────
// view specific board
const getBoard = async (req, res) => {
    const { boardId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(boardId))
        return res.status(400).json({ success: false, message: 'Invalid boardId' });

    const board = await Board.findById(boardId).populate('projectId', 'name');
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

    res.json({ success: true, data: board });
};

// ── GET /api/boards/:boardId/tasks ───────────────────────────────────────────
// view all tasks in board
const getTasksByBoard = async (req, res) => {
    const { boardId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(boardId))
        return res.status(400).json({ success: false, message: 'Invalid boardId' });

    const tasks = await Task.find({ boardId })
        .populate('assigneeId', 'firstName lastName username avatarColor')
        .sort({ createdAt: 1 });

    res.json({ success: true, data: tasks });
};

// ── PATCH /api/boards/:boardId ───────────────────────────────────────────────
const updateBoard = async (req, res) => {
    const { boardId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(boardId))
        return res.status(400).json({ success: false, message: 'Invalid boardId' });

    const { name } = req.body;
    if (!name || !name.trim())
        return res.status(400).json({ success: false, message: 'Board name is required' });

    const board = await Board.findByIdAndUpdate(boardId, { $set: { name: name.trim() } }, { new: true });
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

    res.json({ success: true, data: board });
};

// ── DELETE /api/boards/:boardId ──────────────────────────────────────────────
const deleteBoard = async (req, res) => {
    const { boardId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(boardId))
        return res.status(400).json({ success: false, message: 'Invalid boardId' });

    await Board.findByIdAndDelete(boardId);
    await Task.deleteMany({ boardId });   // cascade delete tasks in board

    res.json({ success: true, message: 'Board and its tasks deleted' });
};

module.exports = { getBoard, getTasksByBoard, updateBoard, deleteBoard };