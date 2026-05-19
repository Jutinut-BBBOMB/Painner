const mongoose = require('mongoose');
const { Task } = require('../models');

// GET /api/tasks/:taskId  — view specific task
const getTask = async (req, res) => {
    const { taskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(taskId))
    return res.status(400).json({ success: false, message: 'Invalid taskId' });

    const task = await Task.findById(taskId)
    .populate('assigneeId', 'firstName lastName username avatarColor')
    .populate('boardId', 'name')
    .populate('projectId', 'name');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
};

// POST /api/boards/:boardId/tasks  — create task in board
const createTask = async (req, res) => {
    const { boardId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(boardId))
    return res.status(400).json({ success: false, message: 'Invalid boardId' });

    const { title, description, status, category, assigneeId, projectId, dueDate } = req.body;
    if (!title || !title.trim())
    return res.status(400).json({ success: false, message: 'title is required' });
    if (!category)
    return res.status(400).json({ success: false, message: 'category is required' });
    if (!projectId)
    return res.status(400).json({ success: false, message: 'projectId is required' });

    const task = await Task.create({
    title: title.trim(), description: description || '',
    status: status || 'todo', category,
    assigneeId: assigneeId || null, projectId, boardId,
    dueDate: dueDate || null, createdBy: req.user.userId,
    });
    const populated = await task.populate('assigneeId', 'firstName lastName username avatarColor');
    res.status(201).json({ success: true, message: 'Task created', data: populated });
};

// PUT /api/tasks/:taskId  — edit task (CS367 feature, PUT per diagram)
const editTask = async (req, res) => {
    const { taskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(taskId))
    return res.status(400).json({ success: false, message: 'Invalid taskId' });

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.createdBy.toString() !== req.user.userId)
    return res.status(403).json({ success: false, message: 'Permission denied' });

    const allowed = ['title', 'description', 'status', 'category', 'assigneeId', 'dueDate', 'boardId'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (!Object.keys(updates).length)
    return res.status(400).json({ success: false, message: 'No valid fields provided' });

    const updated = await Task.findByIdAndUpdate(taskId, { $set: updates }, { new: true, runValidators: true })
    .populate('assigneeId', 'firstName lastName username avatarColor');
    res.json({ success: true, message: 'Task updated', data: updated });
};

// DELETE /api/tasks/:taskId  — delete task
const deleteTask = async (req, res) => {
    const { taskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(taskId))
    return res.status(400).json({ success: false, message: 'Invalid taskId' });

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    await Task.findByIdAndDelete(taskId);
    res.json({ success: true, message: 'Task deleted' });
};

module.exports = { getTask, createTask, editTask, deleteTask };