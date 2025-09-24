import React, { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';

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

const EmployeeDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await taskAPI.getMyTasks();
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      await taskAPI.updateTaskStatus(taskId, { status: newStatus });
      fetchTasks(); // Refresh tasks
      setShowTaskDetails(false);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { bg: '#f8d7da', color: '#721c24' };
      case 'IN_PROGRESS':
        return { bg: '#fff3cd', color: '#856404' };
      case 'COMPLETED':
        return { bg: '#d4edda', color: '#155724' };
      default:
        return { bg: '#e2e3e5', color: '#383d41' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return { bg: '#d1ecf1', color: '#0c5460' };
      case 'MEDIUM':
        return { bg: '#fff3cd', color: '#856404' };
      case 'HIGH':
        return { bg: '#f8d7da', color: '#721c24' };
      case 'URGENT':
        return { bg: '#f5c6cb', color: '#721c24' };
      default:
        return { bg: '#e2e3e5', color: '#383d41' };
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', color: '#333' }}>My Tasks</h1>
      
      {/* Task Statistics */}
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
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>Total Tasks</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{tasks.length}</p>
        </div>
        <div style={{ 
          backgroundColor: '#fff3cd', 
          padding: '1.5rem', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#856404' }}>In Progress</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>
            {tasks.filter(task => task.status === 'IN_PROGRESS').length}
          </p>
        </div>
        <div style={{ 
          backgroundColor: '#d4edda', 
          padding: '1.5rem', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#155724' }}>Completed</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>
            {tasks.filter(task => task.status === 'COMPLETED').length}
          </p>
        </div>
        <div style={{ 
          backgroundColor: '#f8d7da', 
          padding: '1.5rem', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#721c24' }}>Pending</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>
            {tasks.filter(task => task.status === 'PENDING').length}
          </p>
        </div>
      </div>

      {/* Tasks List */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '1.5rem', 
        borderRadius: '8px' 
      }}>
        <h3 style={{ marginTop: 0 }}>Task List</h3>
        {tasks.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#e9ecef' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #dee2e6' }}>Title</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #dee2e6' }}>Priority</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #dee2e6' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #dee2e6' }}>Due Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #dee2e6' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const statusColors = getStatusColor(task.status);
                  const priorityColors = getPriorityColor(task.priority);
                  
                  return (
                    <tr key={task._id}>
                      <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>
                        <strong>{task.title}</strong>
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                          backgroundColor: priorityColors.bg,
                          color: priorityColors.color
                        }}>
                          {task.priority}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                          backgroundColor: statusColors.bg,
                          color: statusColors.color
                        }}>
                          {task.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>
                        <button
                          onClick={() => handleTaskSelect(task)}
                          style={{
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            marginRight: '0.5rem'
                          }}
                        >
                          View
                        </button>
                        {task.status === 'PENDING' && (
                          <button
                            onClick={() => handleTaskStatusUpdate(task._id, 'IN_PROGRESS')}
                            style={{
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.875rem'
                            }}
                          >
                            Start
                          </button>
                        )}
                        {task.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleTaskStatusUpdate(task._id, 'COMPLETED')}
                            style={{
                              backgroundColor: '#17a2b8',
                              color: 'white',
                              border: 'none',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.875rem'
                            }}
                          >
                            Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ fontSize: '1.1rem', color: '#666' }}>No tasks assigned to you yet.</p>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {showTaskDetails && selectedTask && (
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
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Task Details</h3>
              <button
                onClick={() => setShowTaskDetails(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>{selectedTask.title}</h4>
              <p style={{ margin: 0, color: '#666' }}>{selectedTask.description}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <strong>Priority:</strong>
                <span style={{
                  marginLeft: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  backgroundColor: getPriorityColor(selectedTask.priority).bg,
                  color: getPriorityColor(selectedTask.priority).color
                }}>
                  {selectedTask.priority}
                </span>
              </div>
              <div>
                <strong>Status:</strong>
                <span style={{
                  marginLeft: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  backgroundColor: getStatusColor(selectedTask.status).bg,
                  color: getStatusColor(selectedTask.status).color
                }}>
                  {selectedTask.status}
                </span>
              </div>
              <div>
                <strong>Due Date:</strong>
                <span style={{ marginLeft: '0.5rem' }}>
                  {new Date(selectedTask.dueDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <strong>Assigned By:</strong>
                <span style={{ marginLeft: '0.5rem' }}>
                  {selectedTask.assignedBy.name} ({selectedTask.assignedBy.employeeId})
                </span>
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'flex-end',
              marginTop: '2rem',
              paddingTop: '1rem',
              borderTop: '1px solid #eee'
            }}>
              <button
                onClick={() => setShowTaskDetails(false)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              {selectedTask.status === 'PENDING' && (
                <button
                  onClick={() => handleTaskStatusUpdate(selectedTask._id, 'IN_PROGRESS')}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Start Task
                </button>
              )}
              {selectedTask.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => handleTaskStatusUpdate(selectedTask._id, 'COMPLETED')}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;




