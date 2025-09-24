const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Task = require('../models/Task');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', [auth, adminAuth], async(req, res) => {
    try {
        const totalEmployees = await User.countDocuments({ role: 'EMPLOYEE' });
        // An employee is considered available for new tasks if they are not on leave.
        // The priority logic will handle cases where they are busy with another task.
        const availableEmployees = await User.countDocuments({
            role: 'EMPLOYEE',
            leaveStatus: 'AVAILABLE'
        });
        const totalTasks = await Task.countDocuments();
        const pendingTasks = await Task.countDocuments({ status: 'PENDING' });
        const inProgressTasks = await Task.countDocuments({ status: 'IN_PROGRESS' });
        const completedTasks = await Task.countDocuments({ status: 'COMPLETED' });

        // Get recent tasks
        const recentTasks = await Task.find()
            .populate('assignedBy', 'name employeeId')
            .populate('assignedTo', 'name employeeId')
            .sort({ createdAt: -1 })
            .limit(5);

        // Get employees with current tasks
        const employeesWithTasks = await User.find({
                role: 'EMPLOYEE',
                currentTask: { $exists: true, $ne: null }
            })
            .populate('currentTask')
            .select('name employeeId department position currentTask');

        res.json({
            statistics: {
                totalEmployees,
                availableEmployees,
                totalTasks,
                pendingTasks,
                inProgressTasks,
                completedTasks
            },
            recentTasks,
            employeesWithTasks
        });
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all employees with their status
router.get('/employees', [auth, adminAuth], async(req, res) => {
    try {
        const { status, department, page = 1, limit = 10 } = req.query;

        const query = { role: 'EMPLOYEE' };
        if (status === 'available') {
            // For the admin view, "available" means not on leave.
            query.leaveStatus = 'AVAILABLE';
        } else if (status === 'unavailable') {
            // "Unavailable" strictly means on leave.
            query.leaveStatus = { $ne: 'AVAILABLE' };
        }
        if (department) query.department = department;

        const employees = await User.find(query)
            .select('-password')
            .populate('currentTask', 'title status dueDate')
            .sort({ name: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Dynamically determine availability for the UI
        const employeesWithDynamicStatus = employees.map(emp => {
            const empObj = emp.toObject();
            // Force isAvailable to true if the employee is not on leave. This ensures
            // that the frontend dropdown for task assignment will always show employees
            // who are merely busy with another task, allowing for priority overrides.
            empObj.isAvailable = empObj.leaveStatus === 'AVAILABLE';
            return empObj;
        });

        const total = await User.countDocuments(query);

        res.json({
            employees: employeesWithDynamicStatus,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get employee details by employee ID
router.get('/employees/:employeeId', [auth, adminAuth], async(req, res) => {
    try {
        const { employeeId } = req.params;

        const employee = await User.findOne({ employeeId })
            .select('-password')
            .populate({
                path: 'currentTask',
                populate: {
                    path: 'assignedBy',
                    select: 'name employeeId'
                }
            });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Get employee's task history
        const taskHistory = await Task.find({ assignedTo: employee._id })
            .populate('assignedBy', 'name employeeId')
            .sort({ createdAt: -1 });

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
                currentTask: employee.currentTask
            },
            taskHistory
        });
    } catch (error) {
        console.error('Get employee details error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update employee availability (admin override)
router.put('/employees/:employeeId/availability', [auth, adminAuth], [
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

        const { employeeId } = req.params;
        const { isAvailable, leaveStatus, leaveStartDate, leaveEndDate } = req.body;

        const employee = await User.findOne({ employeeId, role: 'EMPLOYEE' });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const updateData = {
            isAvailable,
            leaveStatus
        };

        if (leaveStartDate) updateData.leaveStartDate = new Date(leaveStartDate);
        if (leaveEndDate) updateData.leaveEndDate = new Date(leaveEndDate);

        const updatedEmployee = await User.findByIdAndUpdate(
            employee._id,
            updateData, { new: true }
        ).select('-password');

        res.json({
            message: 'Employee availability updated successfully',
            employee: updatedEmployee
        });
    } catch (error) {
        console.error('Update employee availability error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get task analytics
router.get('/analytics', [auth, adminAuth], async(req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);

        const tasksQuery = dateFilter.$gte ? { createdAt: dateFilter } : {};

        // Task completion rate
        const totalTasks = await Task.countDocuments(tasksQuery);
        const completedTasks = await Task.countDocuments({
            ...tasksQuery,
            status: 'COMPLETED'
        });
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Tasks by status
        const tasksByStatus = await Task.aggregate([
            { $match: tasksQuery },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Tasks by priority
        const tasksByPriority = await Task.aggregate([
            { $match: tasksQuery },
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);

        // Top performing employees
        const topEmployees = await Task.aggregate([
            { $match: {...tasksQuery, status: 'COMPLETED' } },
            { $group: { _id: '$assignedTo', completedTasks: { $sum: 1 } } },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'employee'
                }
            },
            { $unwind: '$employee' },
            {
                $project: {
                    employeeId: '$employee.employeeId',
                    name: '$employee.name',
                    department: '$employee.department',
                    completedTasks: 1
                }
            },
            { $sort: { completedTasks: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            completionRate: Math.round(completionRate * 100) / 100,
            totalTasks,
            completedTasks,
            tasksByStatus,
            tasksByPriority,
            topEmployees
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;