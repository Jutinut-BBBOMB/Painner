const mongoose = require('mongoose');
const { ProjectMember } = require('../models');

// GET /api/projects/:projectId/members
const getMembers = async (req, res) => {
  const { projectId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(projectId))
    return res.status(400).json({ success: false, message: 'Invalid projectId' });
  const members = await ProjectMember.find({ projectId }).populate('userId', '-password');
  res.json({ success: true, data: members });
};

// GET /api/projects/:projectId/members/:userId — view specific member
const getMember = async (req, res) => {
  const { projectId, userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(projectId))
    return res.status(400).json({ success: false, message: 'Invalid projectId' });
  if (!mongoose.Types.ObjectId.isValid(userId))
    return res.status(400).json({ success: false, message: 'Invalid userId' });
  const member = await ProjectMember.findOne({ projectId, userId }).populate('userId', '-password');
  if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
  res.json({ success: true, data: member });
};

// POST /api/projects/:projectId/members
const addMember = async (req, res) => {
  const { projectId } = req.params;
  const { userId, role } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
  const member = await ProjectMember.create({ projectId, userId, role: role || 'Member' });
  res.status(201).json({ success: true, data: member });
};

// PUT /api/projects/:projectId/members/:userId — CS367 feature
const editMember = async (req, res) => {
  const { projectId, userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(projectId))
    return res.status(400).json({ success: false, message: 'Invalid projectId' });
  if (!mongoose.Types.ObjectId.isValid(userId))
    return res.status(400).json({ success: false, message: 'Invalid userId' });

  const target    = await ProjectMember.findOne({ projectId, userId });
  if (!target) return res.status(404).json({ success: false, message: 'Member not found' });

  const requester = await ProjectMember.findOne({ projectId, userId: req.user.userId });
  const isOwner   = requester?.role === 'Owner';
  const isSelf    = req.user.userId === userId;

  if (!isOwner && !isSelf)
    return res.status(403).json({ success: false, message: 'Permission denied' });
  if (req.body.role && !isOwner)
    return res.status(403).json({ success: false, message: 'Only Owner can change roles' });

  const allowed = ['role', 'displayName', 'avatarColor'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  if (!Object.keys(updates).length)
    return res.status(400).json({ success: false, message: 'No valid fields' });

  const updated = await ProjectMember.findOneAndUpdate(
    { projectId, userId }, { $set: updates }, { new: true }
  ).populate('userId', '-password');
  res.json({ success: true, message: 'Member profile updated', data: updated });
};

// DELETE /api/projects/:projectId/members/:userId
const removeMember = async (req, res) => {
  const { projectId, userId } = req.params;
  await ProjectMember.findOneAndDelete({ projectId, userId });
  res.json({ success: true, message: 'Member removed' });
};

module.exports = { getMembers, getMember, addMember, editMember, removeMember };
