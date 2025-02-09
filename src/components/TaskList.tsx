
import React, { useState } from 'react';
import { Task, TaskStatus, taskDb } from '@/lib/db';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { format } from 'date-fns';
import { Download, Search, Upload } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onStatusChange: (taskId: number, newStatus: TaskStatus) => void;
  onViewTask: (task: Task) => void;
  subtasks?: Task[];
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onStatusChange, onViewTask, subtasks }) => {
  const hasSubtasks = subtasks && subtasks.length > 0;
  const allSubtasksCompleted = subtasks?.every(st => st.status === 'Completed');
  const canComplete = !hasSubtasks || allSubtasksCompleted;

  return (
    <Card className="mb-4 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">{task.title}</h3>
          <div className="flex items-center gap-4">
            <Select
              value={task.status}
              onValueChange={(value: TaskStatus) => {
                if (value === 'Completed' && !canComplete) {
                  alert('Cannot complete task until all subtasks are completed');
                  return;
                }
                onStatusChange(task.id, value);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue>{task.status}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todo">Todo</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Review">Review</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => onViewTask(task)}>
              View
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
        {task.dueDate && (
          <p className="text-sm text-gray-500">
            Due: {format(new Date(task.dueDate), 'PPP')}
          </p>
        )}
      </div>
      {hasSubtasks && (
        <Accordion type="single" collapsible>
          <AccordionItem value="subtasks">
            <AccordionTrigger className="px-4">
              Subtasks ({subtasks.length})
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-2">
                {subtasks.map(subtask => (
                  <Card key={subtask.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{subtask.title}</h4>
                        <p className="text-sm text-gray-600">{subtask.description}</p>
                      </div>
                      <Select
                        value={subtask.status}
                        onValueChange={(value: TaskStatus) => onStatusChange(subtask.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue>{subtask.status}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Todo">Todo</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Review">Review</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </Card>
  );
};

interface TaskListProps {
  onViewTask: (task: Task) => void;
}

const TaskList: React.FC<TaskListProps> = ({ onViewTask }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'active' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    taskDb.init().then(() => {
      loadTasks();
    });
  }, []);

  const loadTasks = async () => {
    const allTasks = await taskDb.getAllTasks();
    setTasks(allTasks);
  };

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updatedTask = { ...task, status: newStatus };
      await taskDb.updateTask(updatedTask);
      await loadTasks();
    }
  };

  const handleExport = async () => {
    const csv = await taskDb.exportTasks();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.csv';
    a.click();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          await taskDb.importTasks(text);
          await loadTasks();
        }
      };
      reader.readAsText(file);
    }
  };

  const filteredTasks = tasks
    .filter(task => task.type === 'task')
    .filter(task => {
      const matchesFilter = filter === 'completed' 
        ? task.status === 'Completed'
        : task.status !== 'Completed';
      
      if (searchQuery) {
        return matchesFilter && (
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      return matchesFilter;
    })
    .sort((a, b) => {
      // Sort by status priority
      const statusPriority = {
        'In Progress': 0,
        'Review': 1,
        'Todo': 2,
        'Completed': 3,
      };
      
      const statusDiff = statusPriority[a.status as keyof typeof statusPriority] - 
                        statusPriority[b.status as keyof typeof statusPriority];
      
      if (statusDiff !== 0) return statusDiff;
      
      // Then sort by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return 0;
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            onClick={() => setFilter('active')}
          >
            Active
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[300px] pl-9"
            />
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" asChild>
            <label>
              <Upload className="w-4 h-4 mr-2" />
              Import
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImport}
              />
            </label>
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredTasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onStatusChange={handleStatusChange}
            onViewTask={onViewTask}
            subtasks={tasks.filter(t => t.parentId === task.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskList;
