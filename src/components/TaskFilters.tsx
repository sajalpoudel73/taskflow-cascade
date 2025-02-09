
import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskStatus } from '@/lib/db';

interface TaskFiltersProps {
  filter: 'active' | 'completed';
  setFilter: (filter: 'active' | 'completed') => void;
  statusFilter: TaskStatus | 'all';
  setStatusFilter: (status: TaskStatus | 'all') => void;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  filter,
  setFilter,
  statusFilter,
  setStatusFilter
}) => {
  return (
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
  );
};

export default TaskFilters;
