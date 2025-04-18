/**
 * Authentication routes for the API
 * Created by: Chakridhar
 */
import express from "express";
import { generateToken } from "../clerk.js";
import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import { requireAuth } from "../middleware/clerkAuth.js";

const router = express.Router();

/**
 * Get the current authenticated user
 * Route: GET /api/auth/me
 */
router.get("/me", requireAuth, async (req, res) => {
  try {
    // User is already attached to req by requireAuth middleware
    const user = req.user;
    res.json(user);
  } catch (error) {
    console.error("Error getting current user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Login user
 * Route: POST /api/auth/login
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return user data and token
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Register new user
 * Route: POST /api/auth/register
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password,
      role: role || "student", // Default to student if not specified
    });

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, salt);

    // Save user to database
    await newUser.save();

    // Generate JWT token
    const token = generateToken(newUser);

    // Return user data and token
    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
