import React, { useState, useEffect } from 'react';
import { taskAPI, adminAPI, employeeAPI } from '../services/api';

interface DashboardStats {
  totalEmployees: number;
  availableEmployees: number;
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assignedBy: { name: string; employeeId: string };
  assignedTo: { name: string; employeeId: string };
  createdAt: string;
}

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  department: string;
  position: string;
  isAvailable: boolean;
  leaveStatus: string;
  currentTask?: Task;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, employeesRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getEmployees()
      ]);
      
      setStats(dashboardRes.data.statistics);
      setRecentTasks(dashboardRes.data.recentTasks);
      setEmployees(employeesRes.data.employees);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = async (employeeId: string) => {
    try {
      const response = await adminAPI.getEmployeeDetails(employeeId);
      setSelectedEmployee(response.data.employee);
    } catch (error) {
      console.error('Error fetching employee details:', error);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', color: '#333' }}>Admin Dashboard</h1>
      
      {/* Statistics Cards */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem', 
          marginBottom: '2rem' 
        }}>
          <div style={{ 
            backgroundColor: '#e3f2fd', 
            padding: '1.5rem', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>Total Employees</h3>
            <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{stats.totalEmployees}</p>
          </div>
          <div style={{ 
            backgroundColor: '#e8f5e8', 
            padding: '1.5rem', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#388e3c' }}>Available</h3>
            <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{stats.availableEmployees}</p>
          </div>
          <div style={{ 
            backgroundColor: '#fff3e0', 
            padding: '1.5rem', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#f57c00' }}>Total Tasks</h3>
            <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{stats.totalTasks}</p>
          </div>
          <div style={{ 
            backgroundColor: '#fce4ec', 
            padding: '1.5rem', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#c2185b' }}>Completed</h3>
            <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{stats.completedTasks}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => setShowCreateTask(true)}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '1rem'
          }}
        >
          Create New Task
        </button>
      </div>

      {/* Employee Lookup */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '1.5rem', 
        borderRadius: '8px', 
        marginBottom: '2rem' 
      }}>
        <h3 style={{ marginTop: 0 }}>Employee Lookup</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Enter Employee ID"
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              flex: 1
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement;
                if (target.value) {
                  handleEmployeeSelect(target.value);
                }
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector('input[placeholder="Enter Employee ID"]') as HTMLInputElement;
              if (input?.value) {
                handleEmployeeSelect(input.value);
              }
            }}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Lookup
          </button>
        </div>
        
        {selectedEmployee && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            backgroundColor: 'white', 
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}>
            <h4>Employee Details</h4>
            <p><strong>Name:</strong> {selectedEmployee.name}</p>
            <p><strong>Employee ID:</strong> {selectedEmployee.employeeId}</p>
            <p><strong>Department:</strong> {selectedEmployee.department}</p>
            <p><strong>Position:</strong> {selectedEmployee.position}</p>
            <p><strong>Status:</strong> 
              <span style={{ 
                color: selectedEmployee.isAvailable ? 'green' : 'red',
                marginLeft: '0.5rem'
              }}>
                {selectedEmployee.isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </p>
            {selectedEmployee.currentTask && (
              <div style={{ marginTop: '1rem' }}>
                <h5>Current Task:</h5>
                <p><strong>Title:</strong> {selectedEmployee.currentTask.title}</p>
                <p><strong>Status:</strong> {selectedEmployee.currentTask.status}</p>
                <p><strong>Due Date:</strong> {new Date(selectedEmployee.currentTask.dueDate).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Tasks */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '1.5rem', 
        borderRadius: '8px' 
      }}>
        <h3 style={{ marginTop: 0 }}>Recent Tasks</h3>
        {recentTasks.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#e9ecef' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #dee2e6' }}>Title</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #dee2e6' }}>Assigned To</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #dee2e6' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #dee2e6' }}>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((task) => (
                  <tr key={task._id}>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>{task.title}</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>
                      {task.assignedTo.name} ({task.assignedTo.employeeId})
                    </td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        backgroundColor: task.status === 'COMPLETED' ? '#d4edda' : 
                                       task.status === 'IN_PROGRESS' ? '#fff3cd' : '#f8d7da',
                        color: task.status === 'COMPLETED' ? '#155724' : 
                               task.status === 'IN_PROGRESS' ? '#856404' : '#721c24'
                      }}>
                        {task.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>
                      {new Date(task.dueDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No recent tasks found.</p>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <CreateTaskModal
          onClose={() => setShowCreateTask(false)}
          onTaskCreated={fetchDashboardData}
          employees={employees}
        />
      )}
    </div>
  );
};

// Create Task Modal Component
const CreateTaskModal: React.FC<{
  onClose: () => void;
  onTaskCreated: () => void;
  employees: Employee[];
}> = ({ onClose, onTaskCreated, employees }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'MEDIUM'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await taskAPI.createTask(formData);
      onTaskCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h3 style={{ marginTop: 0 }}>Create New Task</h3>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Assign To
            </label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="">Select Employee</option>
              {employees
                // The backend now correctly determines who is available for an assignment.
                // We only need to filter based on the isAvailable flag sent from the server.
                .filter(emp => emp.isAvailable)
                .map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.employeeId}) - {emp.department}
                  </option>
                ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Due Date
            </label>
            <input
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {error && (
            <div style={{
              color: 'red',
              marginBottom: '1rem',
              padding: '0.5rem',
              backgroundColor: '#ffe6e6',
              border: '1px solid #ffcccc',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: loading ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
