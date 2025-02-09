
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Task, taskDb } from '@/lib/db';
import { format } from 'date-fns';

interface TaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: () => void;
}

const TaskDialog: React.FC<TaskDialogProps> = ({
  task,
  open,
  onOpenChange,
  onTaskUpdated,
}) => {
  const [newSubtask, setNewSubtask] = React.useState({
    title: '',
    description: '',
  });

  const handleAddSubtask = async () => {
    if (!task) return;

    await taskDb.addTask({
      title: newSubtask.title,
      description: newSubtask.description,
      status: 'Todo',
      type: 'sub-task',
      parentId: task.id,
      createdAt: new Date(),
    });

    setNewSubtask({ title: '', description: '' });
    onTaskUpdated();
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription>
            Created on {format(new Date(task.createdAt), 'PPP')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium">Description</h3>
            <p className="text-sm text-gray-600">{task.description}</p>
          </div>
          
          {task.dueDate && (
            <div className="space-y-2">
              <h3 className="font-medium">Due Date</h3>
              <p className="text-sm text-gray-600">
                {format(new Date(task.dueDate), 'PPP')}
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            <h3 className="font-medium">Add Subtask</h3>
            <Input
              placeholder="Subtask title"
              value={newSubtask.title}
              onChange={(e) => setNewSubtask(prev => ({
                ...prev,
                title: e.target.value
              }))}
            />
            <Textarea
              placeholder="Subtask description"
              value={newSubtask.description}
              onChange={(e) => setNewSubtask(prev => ({
                ...prev,
                description: e.target.value
              }))}
            />
            <Button onClick={handleAddSubtask}>Add Subtask</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;
