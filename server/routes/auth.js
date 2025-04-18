import express from "express";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "secret123", {
    expiresIn: "30d",
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    console.log("Registration attempt:", email);

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log("User already exists:", email);
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Create user with fields that match our User model
    const userData = {
      username: email.split("@")[0], // Generate username from email
      email,
      password,
      role: role || "student",
      fullName: name,
      name, // Keep name for backward compatibility
      isEmailVerified: true, // For testing purposes
      createdAt: new Date(),
    };

    console.log("Creating new user with data:", {
      ...userData,
      password: "[HIDDEN]",
    });

    // Create user
    const user = await User.create(userData);

    if (user) {
      console.log("User created successfully:", user._id);
      // Generate token
      const token = generateToken(user._id);

      // Set cookie for persistent session
      res.cookie("authToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: "Lax",
      });

      // Create response user object
      const userResponse = {
        id: user._id,
        name: user.fullName || user.name || user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profilePicture || null,
      };

      res.status(201).json({
        success: true,
        token,
        user: userResponse,
      });
    } else {
      console.log("User creation failed");
      res.status(400).json({
        success: false,
        message: "Invalid user data",
      });
    }
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login a user
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt:", email);

    // Check for user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      console.log("User not found:", email);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    console.log("User found, checking password");

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log("Password does not match");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    console.log("Password matched, generating token");

    // Generate token
    const token = generateToken(user._id);

    // Set cookie for persistent session
    // maxAge is 30 days in milliseconds
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only secure in production
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "Lax",
    });

    // Create response user object with fallbacks for different field names
    const userResponse = {
      id: user._id,
      name: user.name || user.fullName || user.username || "User",
      email: user.email,
      role: user.role,
      profileImage: user.profilePicture || null,
    };

    console.log("Login successful");

    res.json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset link
// @access  Public
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/reset-password/${resetToken}`;

    // TODO: Replace this with email sending logic
    console.log(`Password reset link: ${resetUrl}`);

    res.json({
      success: true,
      message: "Password reset link sent to your email",
      // For development only, can be removed in production
      devResetUrl: resetUrl,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @route   PUT /api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
router.put("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    // Hash token
    const resetPasswordToken = require("crypto")
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user by token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @route   GET /api/auth/user
// @desc    Get current user
// @access  Private
router.get("/user", async (req, res) => {
  try {
    // Try to get token from Authorization header
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Also check for token in cookies as a fallback
    if (!token && req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
    }

    if (!token) {
      console.log("No token provided in request");
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");

    if (!decoded || !decoded.id) {
      console.log("Invalid token format");
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    // Get user from database
    const user = await User.findById(decoded.id);

    if (!user) {
      console.log("No user found for token ID:", decoded.id);
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(`User authenticated: ${user.email}`);

    // Create response with field fallbacks
    const userResponse = {
      id: user._id,
      name: user.name || user.fullName || user.username || "User",
      email: user.email,
      role: user.role,
      profileImage: user.profilePicture || null,
      bio: user.bio || null,
    };

    res.json({
      success: true,
      ...userResponse,
    });
  } catch (error) {
    console.error("Get user error:", error);

    // Determine if it's an authentication error
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user and clear cookie
// @access  Public
router.post("/logout", (req, res) => {
  try {
    // Clear the auth cookie
    res.clearCookie("authToken");

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @route   GET /api/auth/status
// @desc    Get auth status - for debugging
// @access  Public
router.get("/status", async (req, res) => {
  try {
    // Check for cookie
    const authCookie = req.cookies.authToken;

    // Check for header
    const authHeader = req.headers.authorization;
    let headerToken = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      headerToken = authHeader.split(" ")[1];
    }

    // Return status
    res.json({
      success: true,
      hasCookie: !!authCookie,
      hasHeader: !!headerToken,
      cookieValue: authCookie ? "Present (hidden)" : "None",
      headerValue: headerToken ? "Present (hidden)" : "None",
    });
  } catch (error) {
    console.error("Auth status check error:", error);
    res.status(500).json({
      success: false,
      message: "Server error checking auth status",
      error: error.message,
    });
  }
});

export default router;
