const { Team, TeamMember, User } = require('../models');

// GET /api/teams  — my teams
const getMyTeams = async (req, res) => {
    const memberships = await TeamMember.find({ userId: req.user.userId }).populate('teamId');
    const teams = memberships.map(m => ({ ...m.teamId.toObject(), role: m.role }));
    res.json({ success: true, data: teams });
};

// POST /api/teams
const createTeam = async (req, res) => {
    const { name, icon } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Team name required' });
    const team = await Team.create({ name, icon: icon || name[0].toUpperCase(), createdBy: req.user.userId });
    await TeamMember.create({ teamId: team._id, userId: req.user.userId, role: 'Owner' });
    res.status(201).json({ success: true, data: team });
};

// GET /api/teams/:teamId/members
const getTeamMembers = async (req, res) => {
    const members = await TeamMember.find({ teamId: req.params.teamId })
    .populate('userId', '-password');
    const data = members.map(m => ({
    _id: m._id,
    user: m.userId,
    role: m.role,
    joinedAt: m.joinedAt,
    }));
    res.json({ success: true, data });
};

module.exports = { getMyTeams, createTeam, getTeamMembers };
