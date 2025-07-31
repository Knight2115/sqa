import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskList from './TaskList';
import type { Task } from '../../types/Task';

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Test Task 1',
    description: 'First test task',
    completed: false,
    priority: 'high',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
  {
    id: '2',
    title: 'Test Task 2',
    description: 'Second test task',
    completed: true,
    priority: 'medium',
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02'),
  },
];

describe('TaskList', () => {
  it('renders without crashing', () => {
    render(<TaskList tasks={[]} />);
    expect(screen.getByTestId('task-list')).toBeInTheDocument();
  });

  it('displays empty state when no tasks provided', () => {
    render(<TaskList tasks={[]} />);
    expect(screen.getByText('No tasks available')).toBeInTheDocument();
  });

  it('renders all tasks', () => {
    render(<TaskList tasks={mockTasks} />);
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
  });

  it('displays task descriptions', () => {
    render(<TaskList tasks={mockTasks} />);
    expect(screen.getByText('First test task')).toBeInTheDocument();
    expect(screen.getByText('Second test task')).toBeInTheDocument();
  });

  it('shows completed tasks with proper styling', () => {
    render(<TaskList tasks={mockTasks} />);
    const completedTask = screen.getByTestId('task-2'); // task-2 is completed
    const uncompletedTask = screen.getByTestId('task-1'); // task-1 is not completed
    
    expect(completedTask).toHaveClass('opacity-75', 'bg-gray-50');
    expect(uncompletedTask).not.toHaveClass('opacity-75', 'bg-gray-50');
  });

  it('displays priority levels', () => {
    render(<TaskList tasks={mockTasks} />);
    expect(screen.getByText('High Priority')).toBeInTheDocument();
    expect(screen.getByText('Medium Priority')).toBeInTheDocument();
  });

  it('calls onToggleComplete when checkbox is clicked', () => {
    const onToggleComplete = jest.fn();
    render(<TaskList tasks={mockTasks} onToggleComplete={onToggleComplete} />);
    
    const checkbox = screen.getByRole('checkbox', { name: /test task 1/i });
    fireEvent.click(checkbox);
    
    expect(onToggleComplete).toHaveBeenCalledWith('1');
  });

  it('calls onDeleteTask when delete button is clicked', () => {
    const onDeleteTask = jest.fn();
    render(<TaskList tasks={mockTasks} onDeleteTask={onDeleteTask} />);
    
    const deleteButton = screen.getByLabelText(/delete "test task 1"/i);
    fireEvent.click(deleteButton);
    
    expect(onDeleteTask).toHaveBeenCalledWith('1');
  });

  it('has proper accessibility attributes', () => {
    render(<TaskList tasks={mockTasks} />);
    
    const taskList = screen.getByRole('list');
    expect(taskList).toBeInTheDocument();
    
    const taskItems = screen.getAllByRole('listitem');
    expect(taskItems).toHaveLength(2);
  });

  it('renders tasks in correct order', () => {
    render(<TaskList tasks={mockTasks} />);
    const taskItems = screen.getAllByRole('listitem');
    
    expect(taskItems[0]).toHaveAttribute('data-testid', 'task-1');
    expect(taskItems[1]).toHaveAttribute('data-testid', 'task-2');
  });
});