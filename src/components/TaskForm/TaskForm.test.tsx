import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TaskForm from './TaskForm';
import type { TaskFormData } from '../../types/Task';

const mockOnSubmit = jest.fn();

const defaultProps = {
  onSubmit: mockOnSubmit,
};

describe('TaskForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<TaskForm {...defaultProps} />);
    expect(screen.getByTestId('task-form')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(<TaskForm {...defaultProps} />);
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
  });

  it('displays custom submit button text', () => {
    render(<TaskForm {...defaultProps} submitButtonText="Update Task" />);
    expect(screen.getByRole('button', { name: /update task/i })).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(<TaskForm {...defaultProps} isLoading={true} />);
    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('populates form with initial data', () => {
    const initialData = {
      title: 'Test Task',
      description: 'Test Description',
      priority: 'high' as const,
    };

    render(<TaskForm {...defaultProps} initialData={initialData} />);
    
    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    
    const prioritySelect = screen.getByLabelText(/priority/i) as HTMLSelectElement;
    expect(prioritySelect.value).toBe('high');
  });

  it('validates required title field', async () => {
    render(<TaskForm {...defaultProps} />);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    // Wait for error to appear
    const errorElement = await screen.findByText(/title is required/i);
    expect(errorElement).toBeInTheDocument();
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates title minimum length', async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);
    
    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'ab');
    
    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/title must be at least 3 characters/i)).toBeInTheDocument();
    });
  });

  it('validates description maximum length', async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);
    
    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    
    await user.type(titleInput, 'Valid Title');
    await user.type(descriptionInput, 'a'.repeat(501));
    
    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/description must be less than 500 characters/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);
    
    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const prioritySelect = screen.getByLabelText(/priority/i);
    
    await user.type(titleInput, 'Test Task');
    await user.type(descriptionInput, 'Test Description');
    await user.selectOptions(prioritySelect, 'high');
    
    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high',
      });
    });
  });

  it('resets form after successful submission', async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);
    
    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    
    await user.type(titleInput, 'Test Task');
    await user.type(descriptionInput, 'Test Description');
    
    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(titleInput).toHaveValue('');
      expect(descriptionInput).toHaveValue('');
    });
  });

  it('clears errors when user starts typing', async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    // Wait for error to appear first
    const errorElement = await screen.findByText(/title is required/i);
    expect(errorElement).toBeInTheDocument();
    
    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'T');
    
    // Wait for error to disappear
    await waitFor(() => {
      expect(screen.queryByText(/title is required/i)).not.toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', () => {
    render(<TaskForm {...defaultProps} />);
    
    const form = screen.getByRole('form');
    expect(form).toBeInTheDocument();
    
    const titleInput = screen.getByLabelText(/title/i);
    expect(titleInput).toHaveAttribute('required');
    
    const prioritySelect = screen.getByLabelText(/priority/i);
    expect(prioritySelect).toHaveAttribute('required');
  });

  it('prevents submission when form is invalid', async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);
    
    // Add a valid title first (required field)
    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Valid Title');
    
    // Add an invalid description (too long)
    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'a'.repeat(501));
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});