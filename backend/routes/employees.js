const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Task = require('../models/Task');
const { auth, employeeAuth } = require('../middleware/auth');

const router = express.Router();

// Get employee by ID (for admin to view employee details)
router.get('/:employeeId', auth, async(req, res) => {
    try {
        const { employeeId } = req.params;

        const employee = await User.findOne({ employeeId }).select('-password');
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Get employee's current task if any
        let currentTask = null;
        if (employee.currentTask) {
            currentTask = await Task.findById(employee.currentTask)
                .populate('assignedBy', 'name employeeId')
                .populate('assignedTo', 'name employeeId');
        }

        res.json({
            employee: {
                id: employee._id,
                employeeId: employee.employeeId,
                name: employee.name,
                email: employee.email,
                department: employee.department,
                position: employee.position,
                // For the UI, an employee is available for assignment if they are not on leave.
                isAvailable: employee.leaveStatus === 'AVAILABLE',
                leaveStatus: employee.leaveStatus,
                leaveStartDate: employee.leaveStartDate,
                leaveEndDate: employee.leaveEndDate,
                currentTask
            }
        });
    } catch (error) {
        console.error('Get employee error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all employees (for admin)
router.get('/', auth, async(req, res) => {
    try {
        const employees = await User.find({ role: 'EMPLOYEE' })
            .select('-password')
            .sort({ name: 1 });

        // Dynamically determine availability for the UI to ensure consistency
        const employeesWithDynamicStatus = employees.map(emp => {
            const empObj = emp.toObject();
            // For the UI, an employee is available for assignment if they are not on leave.
            empObj.isAvailable = empObj.leaveStatus === 'AVAILABLE';
            return empObj;
        });

        res.json({ employees: employeesWithDynamicStatus });

    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update employee availability status
router.put('/availability', [auth, employeeAuth], [
    body('isAvailable').isBoolean().withMessage('isAvailable must be boolean'),
    body('leaveStatus').isIn(['AVAILABLE', 'ON_LEAVE', 'UNAVAILABLE']).withMessage('Invalid leave status'),
    body('leaveStartDate').optional().isISO8601().withMessage('Invalid start date'),
    body('leaveEndDate').optional().isISO8601().withMessage('Invalid end date')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { isAvailable, leaveStatus, leaveStartDate, leaveEndDate } = req.body;

        const updateData = {
            isAvailable,
            leaveStatus
        };

        if (leaveStartDate) updateData.leaveStartDate = new Date(leaveStartDate);
        if (leaveEndDate) updateData.leaveEndDate = new Date(leaveEndDate);

        const employee = await User.findByIdAndUpdate(
            req.user._id,
            updateData, { new: true }
        ).select('-password');

        res.json({
            message: 'Availability updated successfully',
            employee: {
                id: employee._id,
                employeeId: employee.employeeId,
                name: employee.name,
                isAvailable: employee.isAvailable,
                leaveStatus: employee.leaveStatus,
                leaveStartDate: employee.leaveStartDate,
                leaveEndDate: employee.leaveEndDate
            }
        });
    } catch (error) {
        console.error('Update availability error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get tasks for the logged-in employee
// This is the correct endpoint for the employee dashboard, as per README.md.
router.get('/tasks/my-tasks', [auth, employeeAuth], async(req, res) => {
    try {
        // req.user._id is available from the auth middleware
        const tasks = await Task.find({ assignedTo: req.user._id })
            .populate('assignedBy', 'name employeeId')
            .sort({ createdAt: -1 });

        // The frontend likely expects the tasks array to be wrapped in an object 
        // for consistency with other API endpoints.
        res.json({ tasks });
    } catch (error) {
        console.error('Get my tasks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update task status
router.put('/tasks/:taskId/status', [auth, employeeAuth], [
    body('status').isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { taskId } = req.params;
        const { status } = req.body;

        const task = await Task.findOne({
            _id: taskId,
            assignedTo: req.user._id
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found or not assigned to you' });
        }

        const updateData = { status };

        // If task is started, set it as the current task for the user
        if (status === 'IN_PROGRESS') {
            await User.findByIdAndUpdate(req.user._id, { currentTask: task._id });
        }

        // If task is completed or cancelled, clear current task from user and make them available
        if (status === 'COMPLETED' || status === 'CANCELLED') {
            updateData.completedAt = new Date();

            // Clear current task from user and set them as available
            await User.findByIdAndUpdate(req.user._id, { currentTask: null });
        }

        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            updateData, { new: true }
        ).populate('assignedBy', 'name employeeId');

        res.json({
            message: 'Task status updated successfully',
            task: updatedTask
        });
    } catch (error) {
        console.error('Update task status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add comment to task
router.post('/tasks/:taskId/comments', [auth, employeeAuth], [
    body('comment').notEmpty().withMessage('Comment is required')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { taskId } = req.params;
        const { comment } = req.body;

        const task = await Task.findOne({
            _id: taskId,
            assignedTo: req.user._id
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found or not assigned to you' });
        }

        task.comments.push({
            user: req.user._id,
            comment
        });

        await task.save();

        const updatedTask = await Task.findById(taskId)
            .populate('assignedBy', 'name employeeId')
            .populate('comments.user', 'name employeeId');

        res.json({
            message: 'Comment added successfully',
            task: updatedTask
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;