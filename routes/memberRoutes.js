const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authenticate');
const { getMembers, getMember, addMember, editMember, removeMember } = require('../controllers/memberController');

// GET    /api/projects/:projectId/members            — view all members
router.get('/:projectId/members',              auth, getMembers);

// GET    /api/projects/:projectId/members/:userId    — view specific member
router.get('/:projectId/members/:userId',      auth, getMember);

// POST   /api/projects/:projectId/members            — add member
router.post('/:projectId/members',             auth, addMember);

// PUT    /api/projects/:projectId/members/:userId    — edit profile (CS367)
router.put('/:projectId/members/:userId',      auth, editMember);

// DELETE /api/projects/:projectId/members/:userId    — remove member
router.delete('/:projectId/members/:userId',   auth, removeMember);

module.exports = router;
