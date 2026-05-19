
const { User } = require('../models');

// GET /api/users/:userId
const getUser = async (req, res) => {
  const user = await User.findById(req.params.userId).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user });
};

// PATCH /api/users/:userId  (edit own profile)
const updateUser = async (req, res) => {
  if (req.params.userId !== req.user.userId)
    return res.status(403).json({ success: false, message: 'Cannot edit another user\'s profile' });

  const allowed = ['firstName', 'lastName', 'username', 'avatarColor'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  if (!Object.keys(updates).length)
    return res.status(400).json({ success: false, message: 'No valid fields to update' });

  const user = await User.findByIdAndUpdate(
    req.params.userId, { $set: updates }, { new: true, runValidators: true }
  ).select('-password');
  res.json({ success: true, message: 'Profile updated', data: user });
};

module.exports = { getUser, updateUser };
