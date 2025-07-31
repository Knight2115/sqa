import React, { useState } from 'react';
import TaskForm from '../TaskForm';
import TaskList from '../TaskList';
import type { Task, TaskFormData } from '../../types/Task';

interface TestCase {
  id: string;
  name: string;
  description: string;
  category: 'form' | 'list' | 'integration';
  execute: (context: TestContext) => Promise<TestResult>;
}

interface TestResult {
  passed: boolean;
  message: string;
  details?: string;
}

interface TestContext {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  formRef: React.RefObject<HTMLFormElement | null>;
  lastSubmittedData: TaskFormData | null;
  setLastSubmittedData: React.Dispatch<React.SetStateAction<TaskFormData | null>>;
  handleCreateTask: (taskData: TaskFormData) => void;
}

const TestRunner: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [lastSubmittedData, setLastSubmittedData] = useState<TaskFormData | null>(null);
  const formRef = React.useRef<HTMLFormElement | null>(null);

  const handleCreateTask = (taskData: TaskFormData): void => {
    setLastSubmittedData(taskData);
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskData.title,
      description: taskData.description,
      completed: false,
      priority: taskData.priority,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const testCases: TestCase[] = [
    {
      id: 'form-validation-required',
      name: 'Validación: Campo requerido',
      description: 'Verifica que el título sea obligatorio',
      category: 'form',
      execute: async () => {
        try {
          const form = document.querySelector('[data-testid="task-form"] form') as HTMLFormElement;
          if (!form) return { passed: false, message: 'Formulario no encontrado' };

          // Limpiar campos primero
          const titleInput = form.querySelector('input[name="title"]') as HTMLInputElement;
          const descInput = form.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
          
          if (titleInput) {
            titleInput.value = '';
            titleInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          if (descInput) {
            descInput.value = '';
            descInput.dispatchEvent(new Event('input', { bubbles: true }));
          }

          // Intentar enviar formulario vacío
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);

          // Esperar a que aparezca el error
          await new Promise(resolve => setTimeout(resolve, 200));
          
          const errorElement = document.querySelector('[data-testid="title-error"]');
          const hasError = errorElement && errorElement.textContent?.includes('Title is required');
          
          return {
            passed: !!hasError,
            message: hasError ? 'Error de validación mostrado correctamente' : 'Error de validación no mostrado',
            details: errorElement?.textContent || 'Sin mensaje de error'
          };
        } catch (error) {
          return { passed: false, message: `Error en test: ${error}` };
        }
      }
    },
    {
      id: 'form-submit-valid-direct',
      name: 'Envío: Datos válidos (Directo)',
      description: 'Verifica creación directa de tarea',
      category: 'form',
      execute: async (context) => {
        try {
          const initialTaskCount = context.tasks.length;
          
          const testData: TaskFormData = {
            title: 'Test Task Direct',
            description: 'Descripción directa',
            priority: 'medium'
          };

          // Llamar directamente a la función de creación
          context.handleCreateTask(testData);
          
          // Esperar a que se procese
          await new Promise(resolve => setTimeout(resolve, 200));
          
          const taskAdded = context.tasks.length > initialTaskCount;
          const correctData = context.lastSubmittedData && 
            context.lastSubmittedData.title === testData.title &&
            context.lastSubmittedData.description === testData.description &&
            context.lastSubmittedData.priority === testData.priority;

          const correctTaskData = taskAdded && context.tasks[0] &&
            context.tasks[0].title === testData.title &&
            context.tasks[0].description === testData.description &&
            context.tasks[0].priority === testData.priority;
          
          const allSuccess = taskAdded && !!correctData && !!correctTaskData;
          
          return {
            passed: allSuccess,
            message: allSuccess ? 'Creación directa de tarea exitosa' : 'Error en creación directa',
            details: `Tarea agregada: ${taskAdded}, Datos correctos: ${!!correctData}, Tarea correcta: ${!!correctTaskData}`
          };
        } catch (error) {
          return { passed: false, message: `Error en test directo: ${error}` };
        }
      }
    },
    {
      id: 'form-validation-minlength',
      name: 'Validación: Longitud mínima',
      description: 'Verifica longitud mínima del título (3 caracteres)',
      category: 'form',
      execute: async () => {
        try {
          const titleInput = document.querySelector('input[name="title"]') as HTMLInputElement;
          if (!titleInput) return { passed: false, message: 'Campo título no encontrado' };

          // Limpiar y escribir texto corto
          titleInput.value = '';
          titleInput.dispatchEvent(new Event('input', { bubbles: true }));
          
          titleInput.value = 'ab';
          titleInput.dispatchEvent(new Event('input', { bubbles: true }));
          titleInput.dispatchEvent(new Event('blur', { bubbles: true }));

          // Intentar enviar
          const form = titleInput.closest('form');
          if (form) {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          }

          await new Promise(resolve => setTimeout(resolve, 200));
          
          const errorElement = document.querySelector('[data-testid="title-error"]');
          const hasError = errorElement && errorElement.textContent?.includes('at least 3 characters');
          
          return {
            passed: !!hasError,
            message: hasError ? 'Validación de longitud mínima correcta' : 'Error de longitud mínima no mostrado',
            details: `Valor ingresado: "${titleInput.value}". Error: ${errorElement?.textContent || 'ninguno'}`
          };
        } catch (error) {
          return { passed: false, message: `Error en test: ${error}` };
        }
      }
    },
    {
      id: 'form-submit-valid',
      name: 'Envío: Datos válidos',
      description: 'Verifica que se puede enviar con datos válidos',
      category: 'form',
      execute: async (context) => {
        try {
          const titleInput = document.querySelector('input[name="title"]') as HTMLInputElement;
          const descInput = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
          const prioritySelect = document.querySelector('select[name="priority"]') as HTMLSelectElement;
          
          if (!titleInput || !descInput || !prioritySelect) {
            return { passed: false, message: 'Campos del formulario no encontrados' };
          }

          const initialTaskCount = context.tasks.length;
          
          // Limpiar campos primero
          titleInput.value = '';
          titleInput.dispatchEvent(new Event('input', { bubbles: true }));
          descInput.value = '';
          descInput.dispatchEvent(new Event('input', { bubbles: true }));

          // Esperar un momento para que React procese la limpieza
          await new Promise(resolve => setTimeout(resolve, 100));

          // Llenar formulario con datos válidos
          const testTitle = 'Test Task Visual';
          const testDescription = 'Descripción de prueba';
          const testPriority = 'high';

          // Simular escritura paso a paso
          titleInput.value = testTitle;
          titleInput.dispatchEvent(new Event('input', { bubbles: true }));
          titleInput.dispatchEvent(new Event('change', { bubbles: true }));
          
          descInput.value = testDescription;
          descInput.dispatchEvent(new Event('input', { bubbles: true }));
          descInput.dispatchEvent(new Event('change', { bubbles: true }));
          
          prioritySelect.value = testPriority;
          prioritySelect.dispatchEvent(new Event('change', { bubbles: true }));

          // Esperar a que React procese los cambios
          await new Promise(resolve => setTimeout(resolve, 200));

          // Verificar que los valores están correctamente establecidos
          if (titleInput.value !== testTitle || descInput.value !== testDescription || prioritySelect.value !== testPriority) {
            return {
              passed: false,
              message: 'Los valores no se establecieron correctamente en el formulario',
              details: `Título: "${titleInput.value}" (esperado: "${testTitle}"), Desc: "${descInput.value}" (esperado: "${testDescription}"), Prioridad: "${prioritySelect.value}" (esperado: "${testPriority}")`
            };
          }

          // Crear y disparar evento de envío
          const form = titleInput.closest('form');
          if (!form) {
            return { passed: false, message: 'Formulario no encontrado' };
          }

          // Intentar múltiples formas de envío para máxima compatibilidad
          const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
          
          if (submitButton) {
            // Método 1: Click en el botón de envío (más realista)
            submitButton.click();
          } else {
            // Método 2: Evento de envío directo
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            form.dispatchEvent(submitEvent);
          }

          // Esperar más tiempo para que se procese el envío
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verificar que la tarea se agregó
          const taskAdded = context.tasks.length > initialTaskCount;
          
          // Verificar que el formulario se reseteó (opcional - depende de la implementación)
          const currentTitleInput = document.querySelector('input[name="title"]') as HTMLInputElement;
          const currentDescInput = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
          
          // Debug: verificar estado después del envío
          console.log('Estado después del envío:', {
            taskCount: context.tasks.length,
            initialCount: initialTaskCount,
            lastSubmittedData: context.lastSubmittedData,
            titleValue: currentTitleInput?.value,
            descValue: currentDescInput?.value
          });
          
          const formReset = currentTitleInput && currentDescInput && 
                           currentTitleInput.value === '' && 
                           currentDescInput.value === '';
          
          // Verificar que los datos enviados son correctos
          const correctData = context.lastSubmittedData && 
            context.lastSubmittedData.title === testTitle &&
            context.lastSubmittedData.description === testDescription &&
            context.lastSubmittedData.priority === testPriority;

          // Verificar que la nueva tarea tiene los datos correctos
          let correctTaskData = false;
          if (taskAdded && context.tasks.length > 0) {
            const newestTask = context.tasks[0]; // Las tareas nuevas se agregan al inicio
            correctTaskData = newestTask.title === testTitle && 
                             newestTask.description === testDescription && 
                             newestTask.priority === testPriority;
          }
          
          // Lo importante es que la tarea se creó correctamente con los datos correctos
          const allChecks = taskAdded && correctData && correctTaskData;
          
          return {
            passed: !!allChecks,
            message: allChecks ? 'Formulario enviado correctamente y tarea creada' : 'Error en alguna parte del proceso',
            details: `Tarea agregada: ${taskAdded} (${initialTaskCount} → ${context.tasks.length}), Datos correctos enviados: ${!!correctData}, Tarea con datos correctos: ${correctTaskData}, Formulario reseteado: ${formReset ? 'Sí' : 'No (opcional)'}`
          };
        } catch (error) {
          return { passed: false, message: `Error en test: ${error}` };
        }
      }
    },
    {
      id: 'list-render-empty',
      name: 'Lista: Estado vacío',
      description: 'Verifica el mensaje cuando no hay tareas',
      category: 'list',
      execute: async (context) => {
        // Limpiar todas las tareas
        context.setTasks([]);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const emptyMessage = document.querySelector('[data-testid="task-list"]');
        const hasEmptyState = emptyMessage && emptyMessage.textContent?.includes('No tasks available');
        
        return {
          passed: !!hasEmptyState,
          message: hasEmptyState ? 'Estado vacío mostrado correctamente' : 'Estado vacío no mostrado',
          details: `Contenido: ${emptyMessage?.textContent?.substring(0, 100) || 'No encontrado'}`
        };
      }
    },
    {
      id: 'list-display-tasks',
      name: 'Lista: Mostrar tareas',
      description: 'Verifica que las tareas se muestran correctamente',
      category: 'list',
      execute: async (context) => {
        const testTasks: Task[] = [
          {
            id: 'test-1',
            title: 'Tarea de Prueba 1',
            description: 'Descripción de prueba',
            completed: false,
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'test-2',
            title: 'Tarea de Prueba 2',
            description: 'Segunda descripción',
            completed: true,
            priority: 'low',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        
        context.setTasks(testTasks);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const taskElements = document.querySelectorAll('[data-testid^="task-"]');
        const hasCorrectCount = taskElements.length === testTasks.length;
        const hasTitle1 = Array.from(taskElements).some(el => el.textContent?.includes('Tarea de Prueba 1'));
        const hasTitle2 = Array.from(taskElements).some(el => el.textContent?.includes('Tarea de Prueba 2'));
        
        return {
          passed: hasCorrectCount && hasTitle1 && hasTitle2,
          message: hasCorrectCount && hasTitle1 && hasTitle2 ? 'Tareas mostradas correctamente' : 'Error al mostrar tareas',
          details: `Elementos encontrados: ${taskElements.length}, Esperados: ${testTasks.length}`
        };
      }
    },
    {
      id: 'list-toggle-complete',
      name: 'Lista: Marcar completada',
      description: 'Verifica toggle de completar tarea',
      category: 'list',
      execute: async (context) => {
        if (context.tasks.length === 0) {
          return { passed: false, message: 'No hay tareas para probar' };
        }
        
        const firstTask = context.tasks[0];
        const initialCompleted = firstTask.completed;
        
        const checkbox = document.querySelector(`[data-testid="task-${firstTask.id}"] input[type="checkbox"]`) as HTMLInputElement;
        if (!checkbox) {
          return { passed: false, message: 'Checkbox no encontrado' };
        }
        
        checkbox.click();
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const updatedTask = context.tasks.find(t => t.id === firstTask.id);
        const toggledCorrectly = updatedTask && updatedTask.completed !== initialCompleted;
        
        return {
          passed: !!toggledCorrectly,
          message: toggledCorrectly ? 'Toggle de completar funciona correctamente' : 'Error en toggle de completar',
          details: `Estado inicial: ${initialCompleted}, Estado final: ${updatedTask?.completed}`
        };
      }
    },
    {
      id: 'list-delete-task',
      name: 'Lista: Eliminar tarea',
      description: 'Verifica eliminación de tarea',
      category: 'list',
      execute: async (context) => {
        if (context.tasks.length === 0) {
          return { passed: false, message: 'No hay tareas para probar' };
        }
        
        const initialCount = context.tasks.length;
        const firstTask = context.tasks[0];
        
        const deleteButton = document.querySelector(`[aria-label*="Delete \\"${firstTask.title}\\""]`) as HTMLButtonElement;
        if (!deleteButton) {
          return { passed: false, message: 'Botón de eliminar no encontrado' };
        }
        
        deleteButton.click();
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const newCount = context.tasks.length;
        const taskDeleted = newCount === initialCount - 1;
        
        return {
          passed: taskDeleted,
          message: taskDeleted ? 'Tarea eliminada correctamente' : 'Error al eliminar tarea',
          details: `Tareas antes: ${initialCount}, después: ${newCount}`
        };
      }
    }
  ];

  const handleToggleComplete = (taskId: string): void => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, completed: !task.completed, updatedAt: new Date() }
          : task
      )
    );
  };

  const handleDeleteTask = (taskId: string): void => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const runTest = async (testCase: TestCase): Promise<void> => {
    setIsRunning(true);
    setSelectedTest(testCase.id);
    
    try {
      const context: TestContext = {
        tasks,
        setTasks,
        formRef,
        lastSubmittedData,
        setLastSubmittedData,
        handleCreateTask
      };
      
      const result = await testCase.execute(context);
      setTestResults(prev => ({
        ...prev,
        [testCase.id]: result
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testCase.id]: {
          passed: false,
          message: `Error ejecutando test: ${error}`,
        }
      }));
    } finally {
      setIsRunning(false);
      setSelectedTest(null);
    }
  };

  const runAllTests = async (): Promise<void> => {
    setIsRunning(true);
    const results: Record<string, TestResult> = {};
    
    for (const testCase of testCases) {
      setSelectedTest(testCase.id);
      try {
        const context: TestContext = {
          tasks,
          setTasks,
          formRef,
          lastSubmittedData,
          setLastSubmittedData,
          handleCreateTask
        };
        
        const result = await testCase.execute(context);
        results[testCase.id] = result;
        await new Promise(resolve => setTimeout(resolve, 500)); // Pausa entre tests
      } catch (error) {
        results[testCase.id] = {
          passed: false,
          message: `Error: ${error}`,
        };
      }
    }
    
    setTestResults(results);
    setIsRunning(false);
    setSelectedTest(null);
  };

  const clearResults = (): void => {
    setTestResults({});
    setTasks([]);
    setLastSubmittedData(null);
  };

  const getResultIcon = (testId: string): string => {
    const result = testResults[testId];
    if (!result) return '⚪';
    return result.passed ? '✅' : '❌';
  };

  const getResultColor = (testId: string): string => {
    const result = testResults[testId];
    if (!result) return 'text-gray-400';
    return result.passed ? 'text-green-600' : 'text-red-600';
  };

  const categorizedTests = {
    form: testCases.filter(t => t.category === 'form'),
    list: testCases.filter(t => t.category === 'list'),
    integration: testCases.filter(t => t.category === 'integration'),
  };

  const passedTests = Object.values(testResults).filter(r => r.passed).length;
  const totalTests = Object.keys(testResults).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SQA Visual Test Runner
          </h1>
          <p className="text-gray-600">
            Ejecuta tests interactivos y ve los resultados en tiempo real
          </p>
          {totalTests > 0 && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm border">
              <span className="text-sm font-medium">
                Resultados: {passedTests}/{totalTests} tests pasaron
              </span>
              <div className={`ml-2 w-3 h-3 rounded-full ${passedTests === totalTests ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel de Tests */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Test Suite
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={runAllTests}
                    disabled={isRunning}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isRunning ? 'Ejecutando...' : 'Ejecutar Todos'}
                  </button>
                  <button
                    onClick={clearResults}
                    className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {Object.entries(categorizedTests).map(([category, tests]) => (
                  <div key={category}>
                    <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
                      {category === 'form' ? 'Formulario' : category === 'list' ? 'Lista' : 'Integración'}
                    </h3>
                    <div className="space-y-2">
                      {tests.map((testCase) => (
                        <div
                          key={testCase.id}
                          className={`border rounded-lg p-3 cursor-pointer transition-all ${
                            selectedTest === testCase.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => !isRunning && runTest(testCase)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{getResultIcon(testCase.id)}</span>
                                <h4 className="text-sm font-medium text-gray-900">
                                  {testCase.name}
                                </h4>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                {testCase.description}
                              </p>
                            </div>
                          </div>
                          
                          {testResults[testCase.id] && (
                            <div className={`mt-2 p-2 bg-gray-50 rounded text-xs ${getResultColor(testCase.id)}`}>
                              <div className="font-medium">{testResults[testCase.id].message}</div>
                              {testResults[testCase.id].details && (
                                <div className="text-gray-600 mt-1">{testResults[testCase.id].details}</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Componentes a probar */}
          <div className="lg:col-span-2 space-y-8">
            {/* TaskForm */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                TaskForm Component
              </h2>
              <TaskForm
                onSubmit={handleCreateTask}
                submitButtonText="Create Task"
              />
            </div>

            {/* TaskList */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  TaskList Component
                </h2>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                <TaskList
                  tasks={tasks}
                  onToggleComplete={handleToggleComplete}
                  onDeleteTask={handleDeleteTask}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestRunner;