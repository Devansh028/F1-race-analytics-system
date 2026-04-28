const User = require("../models/User");
const { signToken } = require("../middleware/authMiddleware");

function authResponse(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role: requestedRole, adminCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: "Email already registered." });
    }

    const userCount = await User.countDocuments();
    let role = "USER";

    // Bootstrap: first user becomes admin automatically.
    if (userCount === 0) {
      role = "ADMIN";
    } else if (requestedRole === "ADMIN") {
      const expectedCode = process.env.ADMIN_INVITE_CODE;
      if (!expectedCode || adminCode !== expectedCode) {
        return res.status(403).json({ message: "Invalid admin invite code." });
      }
      role = "ADMIN";
    }

    const user = await User.create({ name, email, password, role });
    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: authResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = signToken(user._id);

    res.status(200).json({
      token,
      user: authResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res) => {
  res.status(200).json({ user: req.user });
};
