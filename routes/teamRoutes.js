const express = require("express");
const router = express.Router();
const auth = require("../middleware/authenticate");
const { getMyTeams, createTeam, getTeamMembers, addTeamMember, removeTeamMember, updateTeamMember } = require('../controllers/teamController');
router.get("/", auth, getMyTeams);
router.post("/", auth, createTeam);
router.get("/:teamId/members", auth, getTeamMembers);
router.post("/:teamId/members", auth, addTeamMember);
router.patch("/:teamId/members/:userId", auth, updateTeamMember);
router.delete("/:teamId/members/:userId", auth, removeTeamMember);

module.exports = router;
