import React from 'react';
import type { TaskListProps } from '../../types/Task';

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onToggleComplete,
  onDeleteTask,
}) => {
  if (tasks.length === 0) {
    return (
      <div data-testid="task-list" className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-900 mb-2">No tasks available</p>
        <p className="text-gray-500">Create your first task to get started!</p>
      </div>
    );
  }

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string): string => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div data-testid="task-list" className="space-y-3">
      <ul role="list" className="space-y-3">
        {tasks.map((task) => (
          <li 
            key={task.id}
            role="listitem"
            data-testid={`task-${task.id}`}
            className={`group relative bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 ${
              task.completed ? 'opacity-75 bg-gray-50' : 'hover:border-gray-300'
            }`}
          >
            <div className="flex items-start space-x-4">
              {/* Checkbox */}
              <div className="flex-shrink-0 pt-1">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => onToggleComplete?.(task.id)}
                  aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
                  className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                />
              </div>
              
              {/* Task Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`text-base font-medium ${
                      task.completed 
                        ? 'text-gray-500 line-through' 
                        : 'text-gray-900'
                    }`}>
                      {task.title}
                    </h3>
                    
                    {task.description && (
                      <p className={`mt-1 text-sm ${
                        task.completed 
                          ? 'text-gray-400 line-through' 
                          : 'text-gray-600'
                      }`}>
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center mt-2 space-x-4 text-xs">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)} Priority
                      </span>
                      
                      <span className="text-gray-500">
                        Created {formatDate(task.createdAt)}
                      </span>
                      
                      {task.updatedAt.getTime() !== task.createdAt.getTime() && (
                        <span className="text-gray-500">
                          Updated {formatDate(task.updatedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex-shrink-0 ml-4">
                    <button
                      onClick={() => onDeleteTask?.(task.id)}
                      aria-label={`Delete "${task.title}"`}
                      className="inline-flex items-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Completion Status Indicator */}
            {task.completed && (
              <div className="absolute top-2 right-2">
                <div className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Completed
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskList;