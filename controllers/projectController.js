const { Project, ProjectMember, Task } = require('../models');

// GET /api/projects?teamId=...
const getProjects = async (req, res) => {
  const { teamId } = req.query;
  const filter = teamId ? { teamId } : {};
  const projects = await Project.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: projects });
};

// GET /api/projects/:projectId
const getProject = async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  res.json({ success: true, data: project });
};

// POST /api/projects
const createProject = async (req, res) => {
  const { name, teamId } = req.body;
  if (!name || !teamId) return res.status(400).json({ success: false, message: 'name and teamId required' });
  const project = await Project.create({ name, teamId, createdBy: req.user.userId });
  await ProjectMember.create({ projectId: project._id, userId: req.user.userId, role: 'Owner', displayName: '' });
  res.status(201).json({ success: true, data: project });
};

// PATCH /api/projects/:projectId
const updateProject = async (req, res) => {
  const { name, status } = req.body;
  const project = await Project.findByIdAndUpdate(
    req.params.projectId, { $set: { name, status } }, { new: true, runValidators: true }
  );
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  res.json({ success: true, data: project });
};

// DELETE /api/projects/:projectId
const deleteProject = async (req, res) => {
  await Project.findByIdAndDelete(req.params.projectId);
  await Task.deleteMany({ projectId: req.params.projectId });
  res.json({ success: true, message: 'Project deleted' });
};

// GET /api/projects/:projectId/stats
const getProjectStats = async (req, res) => {
  const tasks = await Task.find({ projectId: req.params.projectId });
  const stats = { todo: 0, inprogress: 0, review: 0, done: 0, total: tasks.length };
  tasks.forEach(t => { stats[t.status] = (stats[t.status] || 0) + 1; });
  res.json({ success: true, data: stats });
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject, getProjectStats};
