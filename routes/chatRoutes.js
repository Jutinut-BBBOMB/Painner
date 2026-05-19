const express = require('express');
const router  = express.Router();

const auth    = require('../middleware/authenticate');

const { getMessages, sendMessage } = require('../controllers/chatController');

// GET  /api/chats/:chatId/messages   — get all messages in chat
router.get('/:chatId/messages',  auth, getMessages);

// POST /api/chats/:chatId/messages   — send message
router.post('/:chatId/messages', auth, sendMessage);

module.exports = router;