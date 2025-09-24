const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User"); // use your actual schema
const Task = require("./models/Task"); // use your actual schema

async function seed() {
    try {
        await mongoose.connect("mongodb+srv://Tas_Management:mongo123@cluster0.llsatzu.mongodb.net/taskmanagement", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("✅ Connected to DB");

        // Clear old data
        await User.deleteMany({});
        await Task.deleteMany({});

        // Hash passwords
        const adminPass = await bcrypt.hash("admin123", 10);
        const emp1Pass = await bcrypt.hash("emp123", 10);
        const emp2Pass = await bcrypt.hash("emp456", 10);

        // Insert users with full schema
        const users = await User.insertMany([{
                employeeId: "ADM001",
                name: "Admin User",
                email: "admin@example.com",
                password: adminPass,
                role: "ADMIN",
                department: "Management",
                position: "System Admin",
            },
            {
                employeeId: "EMP001",
                name: "John Doe",
                email: "john@example.com",
                password: emp1Pass,
                role: "EMPLOYEE",
                department: "Finance",
                position: "Accountant",
            },
            {
                employeeId: "EMP002",
                name: "Jane Smith",
                email: "jane@example.com",
                password: emp2Pass,
                role: "EMPLOYEE",
                department: "IT",
                position: "Developer",
            }
        ]);

        console.log("✅ Users inserted:", users.map(u => u.employeeId));

        const admin = users.find(u => u.role === "ADMIN");
        const emp1 = users.find(u => u.employeeId === "EMP001");
        const emp2 = users.find(u => u.employeeId === "EMP002");

        // Insert tasks with references
        await Task.insertMany([{
                title: "Prepare Financial Report",
                description: "Compile Q2 financial results and create a summary report.",
                assignedTo: emp1._id,
                assignedBy: admin._id,
                status: "PENDING",
                dueDate: new Date("2025-09-15")
            },
            {
                title: "Update Company Website",
                description: "Fix bugs and update content on the company’s IT portal.",
                assignedTo: emp2._id,
                assignedBy: admin._id,
                status: "IN_PROGRESS",
                dueDate: new Date("2025-09-20")
            }
        ]);

        console.log("✅ Tasks inserted");
        process.exit();
    } catch (err) {
        console.error("❌ Error seeding data:", err);
        process.exit(1);
    }
}

seed();