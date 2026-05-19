
const register = async (req, res) => {
  return res.status(200).json({ message: 'User registered successfully' });
};

module.exports = { register };