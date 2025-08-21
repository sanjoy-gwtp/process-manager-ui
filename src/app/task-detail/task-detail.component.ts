import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Task } from '../models/task.model';
import { ProcessDefinitionService } from '../services/process-definition.service';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.css'],
  standalone: false
})
export class TaskDetailComponent implements OnInit {
  task: Task | null = null;
  loading = false;
  error: string | null = null;
  taskId: string = '';
  completing = false;
  claiming = false;
  unclaiming = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private processDefinitionService: ProcessDefinitionService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.taskId = params['id'];
      if (this.taskId) {
        this.loadTask();
      }
    });
  }

  loadTask(): void {
    this.loading = true;
    this.error = null;

    // Get all tasks and find the specific one
    this.processDefinitionService.getTasks().subscribe({
      next: (data) => {
        const found = data.find(task => task.id === this.taskId);
        if (found) {
          this.task = found;
          this.loading = false;
        } else {
          this.error = 'Task not found';
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = 'Failed to load task details';
        this.loading = false;
        console.error('Error loading task:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/tasks']);
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

  isOverdue(): boolean {
    if (!this.task?.dueDate || this.task.dueDate.length < 6) {
      return false;
    }
    
    const [year, month, day] = this.task.dueDate;
    const due = new Date(year, month - 1, day);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    
    return due.getTime() < now.getTime();
  }

  getPriorityColor(): string {
    if (!this.task) return 'basic';
    
    if (this.task.priority >= 75) {
      return 'warn'; // High priority - red
    } else if (this.task.priority >= 50) {
      return 'primary'; // Medium priority - blue
    } else if (this.task.priority >= 25) {
      return 'accent'; // Low-medium priority - pink/purple
    } else {
      return 'basic'; // Low priority - gray
    }
  }

  getPriorityIcon(): string {
    if (!this.task) return 'help';
    
    if (this.task.priority >= 75) {
      return 'priority_high';
    } else if (this.task.priority >= 50) {
      return 'drag_handle';
    } else {
      return 'low_priority';
    }
  }

  getPriorityText(): string {
    if (!this.task) return 'Unknown';
    
    if (this.task.priority >= 75) {
      return 'High';
    } else if (this.task.priority >= 50) {
      return 'Medium';
    } else if (this.task.priority >= 25) {
      return 'Low-Med';
    } else {
      return 'Low';
    }
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open('Copied to clipboard', 'Close', {
        duration: 2000,
        panelClass: ['success-snackbar']
      });
    }).catch(() => {
      this.snackBar.open('Failed to copy to clipboard', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    });
  }

  viewProcessInstance(): void {
    if (this.task) {
      this.router.navigate(['/instances', this.task.processInstanceId]);
    }
  }

  viewProcessDefinition(): void {
    if (this.task) {
      // Extract process definition key from process definition ID
      const parts = this.task.processDefinitionId.split(':');
      const processKey = parts[0];
      
      // Navigate to processes page - could enhance to go directly to specific definition
      this.router.navigate(['/processes']);
      
      this.snackBar.open(`Navigated to processes page. Look for process: ${processKey}`, 'Close', {
        duration: 4000
      });
    }
  }

  completeTask(): void {
    if (!this.task) return;

    const confirmed = confirm(
      `Are you sure you want to complete the task "${this.task.name}"?\n\n` +
      `This action will mark the task as completed and advance the process to the next step.`
    );

    if (!confirmed) return;

    this.completing = true;
    
    // TODO: Implement task completion API call
    // For now, simulate the completion
    setTimeout(() => {
      this.completing = false;
      
      this.snackBar.open(`Task "${this.task?.name}" has been completed successfully!`, 'Close', {
        duration: 5000,
        panelClass: ['success-snackbar']
      });
      
      // Navigate back to tasks list after completion
      this.router.navigate(['/tasks']);
    }, 1500);
  }

  claimTask(): void {
    if (!this.task) return;

    const confirmed = confirm(
      `Are you sure you want to claim the task "${this.task.name}"?\n\n` +
      `This will assign the task to you.`
    );

    if (!confirmed) return;

    this.claiming = true;
    
    // TODO: Implement task claiming API call
    // For now, simulate the claiming
    setTimeout(() => {
      this.claiming = false;
      
      if (this.task) {
        this.task.assignee = 'currentUser'; // Would be replaced with actual user
      }
      
      this.snackBar.open(`Task "${this.task?.name}" has been claimed successfully!`, 'Close', {
        duration: 5000,
        panelClass: ['success-snackbar']
      });
    }, 1500);
  }

  unclaimTask(): void {
    if (!this.task) return;

    const confirmed = confirm(
      `Are you sure you want to unclaim/unassign the task "${this.task.name}"?\n\n` +
      `This will make the task available for other users to claim.`
    );

    if (!confirmed) return;

    this.unclaiming = true;
    
    // TODO: Implement task unclaiming API call
    // For now, simulate the unclaiming
    setTimeout(() => {
      this.unclaiming = false;
      
      if (this.task) {
        this.task.assignee = null;
      }
      
      this.snackBar.open(`Task "${this.task?.name}" has been unassigned successfully!`, 'Close', {
        duration: 5000,
        panelClass: ['success-snackbar']
      });
    }, 1500);
  }

  reassignTask(): void {
    if (!this.task) return;

    const newAssignee = prompt(
      `Reassign task "${this.task.name}" to:\n\n` +
      `Enter the username of the new assignee:`
    );

    if (!newAssignee || newAssignee.trim() === '') return;

    // TODO: Implement task reassignment API call
    console.log('Reassign task to:', newAssignee);
    this.snackBar.open('Task reassignment not implemented yet', 'Close', {
      duration: 3000
    });
  }

  openTaskForm(): void {
    if (!this.task) return;

    // TODO: Open task form interface
    console.log('Open task form:', this.task.formKey);
    this.snackBar.open('Task form opening not implemented yet', 'Close', {
      duration: 3000
    });
  }
}