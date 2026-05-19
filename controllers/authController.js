const jwt  = require('jsonwebtoken');
const { User } = require('../models');
const JWT_SECRET = process.env.JWT_SECRET;

const signToken = (userId) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
const register = async (req, res) => {
  const { firstName, lastName, email, username, password } = req.body;
  if (!firstName || !lastName || !email || !username || !password)
    return res.status(400).json({ success: false, message: 'All fields are required' });

  const user = await User.create({ firstName, lastName, email, username, password });
  const token = signToken(user._id);
  res.status(201).json({ success: true, token, user: user.toSafe() });
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password required' });

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const token = signToken(user._id);
  res.json({ success: true, token, user: user.toSafe() });
};

module.exports = { register, login };