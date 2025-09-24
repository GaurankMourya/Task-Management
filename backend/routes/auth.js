const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register
router.post('/register', [
    body('employeeId').notEmpty().withMessage('Employee ID is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['ADMIN', 'EMPLOYEE']).withMessage('Role must be ADMIN or EMPLOYEE'),
    body('department').notEmpty().withMessage('Department is required'),
    body('position').notEmpty().withMessage('Position is required')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { employeeId, name, email, password, role, department, position } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { employeeId }]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email or employee ID' });
        }

        const user = new User({
            employeeId,
            name,
            email,
            password,
            role,
            department,
            position
        });

        await user.save();

        const token = jwt.sign({ userId: user._id, role: user.role },
            JWT_SECRET, { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                employeeId: user.employeeId,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                position: user.position
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login
router.post('/login', [
    body('employeeId').notEmpty().withMessage('Employee ID is required'),
    body('password').notEmpty().withMessage('Password is required')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { employeeId, password } = req.body;

        const user = await User.findOne({ employeeId });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id, _id: user._id, employeeId: user.employeeId, role: user.role },
            JWT_SECRET, { expiresIn: '7d' }
        );



        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                employeeId: user.employeeId,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                position: user.position,
                // For the UI, an employee is available for assignment if they are not on leave.
                isAvailable: user.leaveStatus === 'AVAILABLE',
                leaveStatus: user.leaveStatus
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Get current user
router.get('/me', auth, async(req, res) => {
    try {
        res.json({
            user: {
                id: req.user._id,
                employeeId: req.user.employeeId,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                department: req.user.department,
                position: req.user.position,
                isAvailable: req.user.isAvailable,
                leaveStatus: req.user.leaveStatus,
                currentTask: req.user.currentTask
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;