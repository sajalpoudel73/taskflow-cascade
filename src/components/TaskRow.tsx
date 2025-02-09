
import React from 'react';
import { Task, TaskStatus } from '@/lib/db';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { Eye, Trash, ChevronDown, ChevronRight } from 'lucide-react';

interface TaskRowProps {
  task: Task;
  onStatusChange: (taskId: number, newStatus: TaskStatus) => void;
  onViewTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
  subtasks?: Task[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const TaskRow: React.FC<TaskRowProps> = ({
  task,
  onStatusChange,
  onViewTask,
  onDeleteTask,
  subtasks,
  isExpanded,
  onToggleExpand
}) => {
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
                onClick={onToggleExpand}
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
          <TableCell className="pl-10">{subtask.id}</TableCell>
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

export default TaskRow;
