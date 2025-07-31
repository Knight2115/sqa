import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import type { TaskFormProps, TaskFormData, TaskFormErrors } from '../../types/Task';

const TaskForm: React.FC<TaskFormProps> = ({
  onSubmit,
  initialData = {},
  isLoading = false,
  submitButtonText = 'Create Task',
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: initialData.title || '',
    description: initialData.description || '',
    priority: initialData.priority || 'medium',
  });

  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFormData({
      title: initialData.title || '',
      description: initialData.description || '',
      priority: initialData.priority || 'medium',
    });
  }, [initialData.title, initialData.description, initialData.priority]);

  const validateField = (name: keyof TaskFormData, value: string): string | undefined => {
    switch (name) {
      case 'title':
        if (!value.trim()) {
          return 'Title is required';
        }
        if (value.trim().length < 3) {
          return 'Title must be at least 3 characters';
        }
        if (value.trim().length > 100) {
          return 'Title must be less than 100 characters';
        }
        break;
      case 'description':
        if (value.length > 500) {
          return 'Description must be less than 500 characters';
        }
        break;
      case 'priority':
        if (!['low', 'medium', 'high'].includes(value)) {
          return 'Please select a valid priority';
        }
        break;
    }
    return undefined;
  };

  const validateForm = (): { isValid: boolean; errors: TaskFormErrors } => {
    const newErrors: TaskFormErrors = {};
    
    newErrors.title = validateField('title', formData.title);
    newErrors.description = validateField('description', formData.description);
    newErrors.priority = validateField('priority', formData.priority);
    
    const hasErrors = Object.values(newErrors).some(error => error);
    
    return { isValid: !hasErrors, errors: newErrors };
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    const fieldName = name as keyof TaskFormData;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (touched[name]) {
      const fieldError = validateField(fieldName, value);
      setErrors(prev => ({
        ...prev,
        [name]: fieldError,
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    const fieldName = name as keyof TaskFormData;
    
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));

    const fieldError = validateField(fieldName, value);
    setErrors(prev => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    const validation = validateForm();
    const newTouched = {
      title: true,
      description: true,
      priority: true,
    };
    
    // Use flushSync to ensure synchronous state updates
    flushSync(() => {
      setTouched(newTouched);
      setErrors(validation.errors);
    });
    
    if (!validation.isValid) {
      return;
    }

    onSubmit(formData);
    
    if (!initialData?.title) {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
      });
      setTouched({});
      setErrors({});
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div data-testid="task-form" className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <form onSubmit={handleSubmit} role="form" className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            onBlur={handleBlur}
            required
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
              errors.title && touched.title
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300'
            }`}
            placeholder="Enter task title"
          />
          {errors.title && touched.title && (
            <p className="mt-1 text-sm text-red-600" role="alert" data-testid="title-error">
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            onBlur={handleBlur}
            rows={3}
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-vertical ${
              errors.description && touched.description
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300'
            }`}
            placeholder="Enter task description (optional)"
          />
          {errors.description && touched.description && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.description}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority *
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            onBlur={handleBlur}
            required
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
              errors.priority && touched.priority
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300'
            }`}
          >
            <option value="low" className="text-green-600">Low</option>
            <option value="medium" className="text-yellow-600">Medium</option>
            <option value="high" className="text-red-600">High</option>
          </select>
          {errors.priority && touched.priority && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.priority}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Selected Priority:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(formData.priority)}`}>
            {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
          </span>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? 'Loading...' : submitButtonText}
        </button>
      </form>
    </div>
  );
};

export default TaskForm;