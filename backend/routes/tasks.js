const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/tasks';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only documents, images, and archives are allowed'));
        }
    }
});

// Get all tasks (for admin)
router.get('/', auth, async(req, res) => {
    try {
        const { status, assignedTo, page = 1, limit = 10 } = req.query;

        const query = {};
        if (status) query.status = status;
        if (assignedTo) query.assignedTo = assignedTo;

        const tasks = await Task.find(query)
            .populate('assignedBy', 'name employeeId')
            .populate('assignedTo', 'name employeeId')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Task.countDocuments(query);

        res.json({
            tasks,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get task by ID
router.get('/:taskId', auth, async(req, res) => {
    try {
        const { taskId } = req.params;

        const task = await Task.findById(taskId)
            .populate('assignedBy', 'name employeeId')
            .populate('assignedTo', 'name employeeId')
            .populate('comments.user', 'name employeeId');

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({ task });
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new task
router.post('/', [auth, adminAuth], [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('assignedTo').isMongoId().withMessage('Valid employee ID is required'),
    body('dueDate').isISO8601().withMessage('Valid due date is required'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, assignedTo, dueDate, priority = 'MEDIUM' } = req.body;

        // Check if employee exists and is available
        const employee = await User.findOne({
            _id: assignedTo,
            role: 'EMPLOYEE'
        });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        if (employee.leaveStatus !== 'AVAILABLE') {
            return res.status(400).json({
                message: 'Employee is not available for task assignment',
                employeeStatus: {
                    isAvailable: employee.isAvailable,
                    leaveStatus: employee.leaveStatus,
                    leaveStartDate: employee.leaveStartDate,
                    leaveEndDate: employee.leaveEndDate
                }
            });
        }

        // Check if employee already has a current task
        if (employee.currentTask) {
            const oldCurrentTask = await Task.findById(employee.currentTask);
            // Allow assignment if the new task has HIGH or URGENT priority
            if (priority === 'HIGH' || priority === 'URGENT') {
                // If a high-priority task is assigned, move the old task back to PENDING
                if (oldCurrentTask && oldCurrentTask.status === 'IN_PROGRESS') {
                    oldCurrentTask.status = 'PENDING'; // Re-queue the old task
                    await oldCurrentTask.save();
                    console.log(`Old task ${oldCurrentTask._id} for employee ${employee.employeeId} set to PENDING due to higher priority assignment.`);
                }
                // Continue with task creation.
            } else {
                // If new task is LOW or MEDIUM priority, block assignment
                return res.status(400).json({
                    message: `Employee already has an active task (${employee.currentTask}). Cannot assign a ${priority.toLowerCase()} priority task.`,
                    currentTask: employee.currentTask,
                    currentTaskPriority: oldCurrentTask ? oldCurrentTask.priority : 'UNKNOWN'
                });
            }
        }

        // Create task
        const task = new Task({
            title,
            description,
            assignedBy: req.user._id,
            assignedTo,
            dueDate: new Date(dueDate),
            priority
        });

        await task.save();

        // Update employee's current task
        await User.findByIdAndUpdate(assignedTo, { currentTask: task._id });

        const populatedTask = await Task.findById(task._id)
            .populate('assignedBy', 'name employeeId')
            .populate('assignedTo', 'name employeeId');

        res.status(201).json({
            message: 'Task created and assigned successfully',
            task: populatedTask
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload document to task
router.post('/:taskId/documents', [auth], upload.single('document'), async(req, res) => {
    try {
        const { taskId } = req.params;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user is authorized (admin who assigned or employee assigned to)
        if (task.assignedBy.toString() !== req.user._id.toString() &&
            task.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to upload documents to this task' });
        }

        const document = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: req.file.path
        };

        task.documents.push(document);
        await task.save();

        res.json({
            message: 'Document uploaded successfully',
            document
        });
    } catch (error) {
        console.error('Upload document error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Download document
router.get('/documents/:filename', auth, async(req, res) => {
    try {
        const { filename } = req.params;

        // Security Fix: Prevent path traversal and ensure user is authorized.
        // Find a task that belongs to the user and contains the requested document.
        const task = await Task.findOne({
            'documents.filename': filename,
            $or: [{ assignedTo: req.user._id }, { assignedBy: req.user._id }]
        });

        if (!task) {
            return res.status(404).json({ message: 'File not found or you are not authorized to access it.' });
        }

        const filePath = path.join(__dirname, '../uploads/tasks', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.download(filePath, task.documents.find(doc => doc.filename === filename).originalName);
    } catch (error) {
        console.error('Download document error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update task
router.put('/:taskId', [auth], [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().notEmpty().withMessage('Description cannot be empty'),
    body('dueDate').optional().isISO8601().withMessage('Valid due date is required'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { taskId } = req.params;
        const updates = req.body;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Authorization: Allow the admin who assigned OR the employee it's assigned to.
        const isAssigner = task.assignedBy.toString() === req.user._id.toString();
        const isAssignee = task.assignedTo.toString() === req.user._id.toString();
        if (!isAssigner && !isAssignee) {
            return res.status(403).json({ message: 'You are not authorized to update this task.' });
        }

        if (updates.dueDate) {
            updates.dueDate = new Date(updates.dueDate);
        }

        const updatedTask = await Task.findByIdAndUpdate(
                taskId,
                updates, { new: true }
            ).populate('assignedBy', 'name employeeId')
            .populate('assignedTo', 'name employeeId');

        res.json({
            message: 'Task updated successfully',
            task: updatedTask
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete task
router.delete('/:taskId', auth, async(req, res) => {
    try {
        const { taskId } = req.params;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user is authorized (admin who assigned)
        if (task.assignedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this task' });
        }

        // Clear current task from employee
        await User.findByIdAndUpdate(task.assignedTo, { currentTask: null });

        // Delete associated files
        task.documents.forEach(doc => {
            const filePath = path.join(__dirname, '../uploads/tasks', doc.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        await Task.findByIdAndDelete(taskId);

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;