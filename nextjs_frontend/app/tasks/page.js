'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const INITIAL_TASKS = [
  { id: '1', title: 'Complete Mathematics Assignment', description: 'Solve all problems in Chapter 5', dueDate: '2024-01-15', priority: 'High', status: 'Pending', subject: 'Mathematics' },
  { id: '2', title: 'Write Literature Essay', description: 'Analyze the theme of love in Romeo and Juliet', dueDate: '2024-01-18', priority: 'Medium', status: 'In Progress', subject: 'Literature' },
  { id: '3', title: 'Science Lab Report', description: 'Document the chemical reaction experiment', dueDate: '2024-01-20', priority: 'High', status: 'Completed', subject: 'Science' },
  { id: '4', title: 'Computer Science Project', description: 'Build a simple calculator app', dueDate: '2024-01-25', priority: 'Medium', status: 'Pending', subject: 'Computer Science' },
  { id: '5', title: 'History Presentation', description: 'Prepare slides on World War II', dueDate: '2024-01-22', priority: 'Low', status: 'In Progress', subject: 'History' },
];

const priorityColors = { High: '#F44336', Medium: '#FF9800', Low: '#4CAF50' };
const statusColors   = { Completed: '#4CAF50', 'In Progress': '#2196F3', Pending: '#FF9800' };

export default function TasksPage() {
  const router = useRouter();
  const [tasks] = useState(INITIAL_TASKS);
  const [filter, setFilter] = useState('All');

  const filters = ['All', 'Pending', 'In Progress', 'Completed'];
  const filtered = filter === 'All' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div className="mobile-container" style={{ background: '#F5F5F5' }}>
      {/* Header */}
      <div className="header">
        <button id="btn-back" className="back-btn" onClick={() => router.push('/student-dashboard')}>←</button>
        <span className="header-title">Tasks</span>
        <button
          id="btn-add-task"
          onClick={() => alert('Task creation will be available in a future version')}
          style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: '20px', padding: '7px 14px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
        >+ Add</button>
      </div>

      <div className="scroll-content">
        {/* Summary bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
          {['Pending','In Progress','Completed'].map(s => {
            const count = tasks.filter(t => t.status === s).length;
            return (
              <div key={s} className="card" style={{ padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: statusColors[s] }}>{count}</div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '3px' }}>{s}</div>
              </div>
            );
          })}
        </div>

        {/* Filter chips */}
        <div className="chips">
          {filters.map(f => (
            <button
              key={f}
              id={`filter-${f.toLowerCase().replace(' ', '-')}`}
              className={`chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Task list */}
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
            <p style={{ color: '#666' }}>No {filter.toLowerCase()} tasks</p>
          </div>
        ) : (
          filtered.map(task => (
            <div
              key={task.id}
              id={`task-${task.id}`}
              className="task-item"
              onClick={() => alert('Task details will be available in a future version')}
            >
              <div className="task-header">
                <span className="task-title">{task.title}</span>
                <span
                  className="priority-badge"
                  style={{ background: priorityColors[task.priority], marginLeft: '8px', flexShrink: 0 }}
                >
                  {task.priority}
                </span>
              </div>
              <p className="task-desc">{task.description}</p>
              <div className="task-meta">
                <span className="task-date">📅 Due: {task.dueDate}</span>
                <span className="status-badge" style={{ background: statusColors[task.status] }}>
                  {task.status}
                </span>
              </div>
              <div style={{ marginTop: '6px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: '600',
                  background: '#EEF0FF', color: '#5C6BC0',
                  padding: '3px 8px', borderRadius: '10px',
                }}>
                  {task.subject}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
