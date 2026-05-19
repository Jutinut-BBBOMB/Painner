const express = require('express');
const router  = express.Router();

const auth = require('../middleware/authenticate');

const { getUser, updateUser } = require('../controllers/userController');

router.get('/:userId', auth, getUser);
router.patch('/:userId', auth, updateUser);

module.exports = router;
