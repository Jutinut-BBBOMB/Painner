const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authenticate');

const { getMyTeams, createTeam, getTeamMembers } = require('../controllers/teamController');

router.get('/',auth, getMyTeams);
router.post('/',auth, createTeam);
router.get('/:teamId/members',auth, getTeamMembers);

module.exports = router;
