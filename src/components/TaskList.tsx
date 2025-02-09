
import React, { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { Download, Search, Upload, Eye, Edit, Trash, ChevronDown, ChevronRight } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onStatusChange: (taskId: number, newStatus: TaskStatus) => void;
  onViewTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
  subtasks?: Task[];
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onStatusChange, onViewTask, onDeleteTask, subtasks }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubtasks = subtasks && subtasks.length > 0;
  const allSubtasksCompleted = subtasks?.every(st => st.status === 'Completed');
  const canComplete = !hasSubtasks || allSubtasksCompleted;

  return (
    <>
      <TableRow>
        <TableCell>{task.id}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {hasSubtasks && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
            {task.title}
          </div>
        </TableCell>
        <TableCell className="max-w-[200px] truncate">{task.description}</TableCell>
        <TableCell>{task.dueDate ? format(new Date(task.dueDate), 'PP') : '-'}</TableCell>
        <TableCell>
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
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => onViewTask(task)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDeleteTask(task.id)}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && hasSubtasks && subtasks.map(subtask => (
        <TableRow key={subtask.id} className="bg-muted/50">
          <TableCell>{subtask.id}</TableCell>
          <TableCell className="pl-10">{subtask.title}</TableCell>
          <TableCell className="max-w-[200px] truncate">{subtask.description}</TableCell>
          <TableCell>-</TableCell>
          <TableCell>
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
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => onViewTask(subtask)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDeleteTask(subtask.id)}>
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};

interface TaskListProps {
  onViewTask: (task: Task) => void;
}

const TaskList: React.FC<TaskListProps> = ({ onViewTask }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'active' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');

  useEffect(() => {
    taskDb.init().then(() => {
      loadTasks();
    });

    const handleTaskCreated = () => {
      loadTasks();
    };

    window.addEventListener('taskCreated', handleTaskCreated);
    return () => window.removeEventListener('taskCreated', handleTaskCreated);
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

  const handleDeleteTask = async (taskId: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await taskDb.deleteTask(taskId);
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
      
      const matchesStatusFilter = statusFilter === 'all' || task.status === statusFilter;
      
      if (searchQuery) {
        return matchesFilter && matchesStatusFilter && (
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      return matchesFilter && matchesStatusFilter;
    })
    .sort((a, b) => {
      const statusPriority = {
        'In Progress': 0,
        'Review': 1,
        'Todo': 2,
        'Completed': 3,
      };
      
      const statusDiff = statusPriority[a.status as keyof typeof statusPriority] - 
                        statusPriority[b.status as keyof typeof statusPriority];
      
      if (statusDiff !== 0) return statusDiff;
      
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

          {filter === 'active' && (
            <Select value={statusFilter} onValueChange={(value: TaskStatus | 'all') => setStatusFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Todo">Todo</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Review">Review</SelectItem>
              </SelectContent>
            </Select>
          )}
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
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
              onViewTask={onViewTask}
              onDeleteTask={handleDeleteTask}
              subtasks={tasks.filter(t => t.parentId === task.id)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TaskList;
