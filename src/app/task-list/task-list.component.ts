import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Task } from '../models/task.model';
import { ProcessDefinitionService } from '../services/process-definition.service';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css'],
  standalone: false
})
export class TaskListComponent implements OnInit {
  tasks: Task[] = [];
  loading = false;
  error: string | null = null;

  displayedColumns: string[] = [
    'name',
    'description', 
    'assignee', 
    'priority',
    'created',
    'dueDate',
    'processInstance',
    'category',
    'actions'
  ];

  constructor(
    private processDefinitionService: ProcessDefinitionService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading = true;
    this.error = null;

    this.processDefinitionService.getTasks().subscribe({
      next: (data) => {
        this.tasks = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load process tasks';
        this.loading = false;
        console.error('Error loading tasks:', err);
      }
    });
  }

  formatCreateTime(createTime: number[]): string {
    if (!createTime || createTime.length < 6) {
      return 'Unknown';
    }
    
    const [year, month, day, hour, minute, second] = createTime;
    const date = new Date(year, month - 1, day, hour, minute, second);
    
    return date.toLocaleString();
  }

  formatDueDate(dueDate: number[]): string {
    if (!dueDate || dueDate.length < 6) {
      return 'Unknown';
    }
    
    const [year, month, day, hour, minute, second] = dueDate;
    const date = new Date(year, month - 1, day, hour, minute, second);
    
    return date.toLocaleDateString();
  }

  isOverdue(dueDate: number[]): boolean {
    if (!dueDate || dueDate.length < 6) {
      return false;
    }
    
    const [year, month, day] = dueDate;
    const due = new Date(year, month - 1, day);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    
    return due.getTime() < now.getTime();
  }

  getPriorityColor(priority: number): string {
    if (priority >= 75) {
      return 'warn'; // High priority - red
    } else if (priority >= 50) {
      return 'primary'; // Medium priority - blue
    } else if (priority >= 25) {
      return 'accent'; // Low-medium priority - pink/purple
    } else {
      return 'basic'; // Low priority - gray
    }
  }

  getPriorityIcon(priority: number): string {
    if (priority >= 75) {
      return 'priority_high';
    } else if (priority >= 50) {
      return 'drag_handle';
    } else {
      return 'low_priority';
    }
  }

  getPriorityText(priority: number): string {
    if (priority >= 75) {
      return 'High';
    } else if (priority >= 50) {
      return 'Medium';
    } else if (priority >= 25) {
      return 'Low-Med';
    } else {
      return 'Low';
    }
  }

  viewTaskDetails(task: Task): void {
    this.router.navigate(['/tasks', task.id]);
  }

  viewProcessInstance(task: Task): void {
    this.router.navigate(['/instances', task.processInstanceId]);
  }

  completeTask(task: Task): void {
    const confirmed = confirm(
      `Are you sure you want to complete the task "${task.name}"?\n\n` +
      `This action will mark the task as completed and advance the process.`
    );

    if (!confirmed) return;

    // TODO: Implement task completion API call
    console.log('Complete task:', task);
    this.snackBar.open('Task completion not implemented yet', 'Close', {
      duration: 3000
    });
  }

  claimTask(task: Task): void {
    const confirmed = confirm(
      `Are you sure you want to claim the task "${task.name}"?\n\n` +
      `This will assign the task to you.`
    );

    if (!confirmed) return;

    // TODO: Implement task claiming API call
    console.log('Claim task:', task);
    this.snackBar.open('Task claiming not implemented yet', 'Close', {
      duration: 3000
    });
  }

  openTaskForm(task: Task): void {
    // TODO: Open task form interface
    console.log('Open task form:', task);
    this.snackBar.open('Task form not implemented yet', 'Close', {
      duration: 3000
    });
  }
}