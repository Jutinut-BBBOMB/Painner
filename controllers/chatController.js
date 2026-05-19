
const mongoose = require('mongoose');
const { ProjectChat, Message } = require('../models');

// GET /api/chats/:chatId/messages — get all messages in chat
const getMessages = async (req, res) => {
  const { chatId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(chatId))
    return res.status(400).json({ success: false, message: 'Invalid chatId' });

  const messages = await Message.find({ chatId })
    .populate('senderId', 'firstName lastName username avatarColor')
    .sort({ createdAt: 1 })
    .limit(200);
  res.json({ success: true, data: messages });
};

// POST /api/chats/:chatId/messages — send message
const sendMessage = async (req, res) => {
  const { chatId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(chatId))
    return res.status(400).json({ success: false, message: 'Invalid chatId' });

  const { text } = req.body;
  if (!text || !text.trim())
    return res.status(400).json({ success: false, message: 'text is required' });

  const msg = await Message.create({ chatId, senderId: req.user.userId, text: text.trim() });
  const populated = await msg.populate('senderId', 'firstName lastName username avatarColor');
  res.status(201).json({ success: true, data: populated });
};

module.exports = { getMessages, sendMessage };