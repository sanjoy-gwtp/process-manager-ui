import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProcessDefinition } from '../models/process-definition.model';
import { ProcessDefinitionService } from '../services/process-definition.service';

@Component({
  selector: 'app-process-detail',
  templateUrl: './process-detail.component.html',
  styleUrls: ['./process-detail.component.css'],
  standalone: false
})
export class ProcessDetailComponent implements OnInit {
  processDefinition: ProcessDefinition | null = null;
  loading = false;
  error: string | null = null;
  processId: string = '';
  suspending = false;
  deleting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private processDefinitionService: ProcessDefinitionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.processId = params['id'];
      if (this.processId) {
        this.loadProcessDefinition();
      }
    });
  }

  loadProcessDefinition(): void {
    this.loading = true;
    this.error = null;

    // First try to get all process definitions and find the specific one
    this.processDefinitionService.getProcessDefinitions().subscribe({
      next: (data) => {
        const found = data.find(p => p.id === this.processId);
        if (found) {
          this.processDefinition = found;
          this.loading = false;
        } else {
          this.error = 'Process definition not found';
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = 'Failed to load process definition details';
        this.loading = false;
        console.error('Error loading process definition:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/processes']);
  }

  startProcess(): void {
    if (this.processDefinition) {
      console.log('Starting process:', this.processDefinition.key);
      // TODO: Implement start process functionality
    }
  }

  viewDiagram(): void {
    if (this.processDefinition) {
      this.router.navigate(['/diagram'], { 
        queryParams: { 
          processId: this.processDefinition.id,
          processName: this.processDefinition.name || this.processDefinition.key
        } 
      });
    }
  }

  suspendProcess(): void {
    if (!this.processDefinition) return;

    const processName = this.processDefinition.name || this.processDefinition.key;
    const action = this.processDefinition.suspended ? 'activate' : 'suspend';
    const actionText = this.processDefinition.suspended ? 'activate' : 'suspend';
    
    // Show confirmation dialog
    const confirmed = confirm(
      `Are you sure you want to ${actionText} the process definition "${processName}"?\n\n` +
      `This will ${this.processDefinition.suspended ? 'enable' : 'disable'} new process instances from being started.`
    );

    if (!confirmed) return;

    this.suspending = true;
    
    const operation = this.processDefinition.suspended 
      ? this.processDefinitionService.activateProcessDefinition(this.processDefinition.id)
      : this.processDefinitionService.suspendProcessDefinition(this.processDefinition.id);

    operation.subscribe({
      next: (response) => {
        this.suspending = false;
        
        // Update the local state
        if (this.processDefinition) {
          this.processDefinition.suspended = !this.processDefinition.suspended;
        }
        
        const message = this.processDefinition?.suspended 
          ? `Process "${processName}" has been suspended successfully!`
          : `Process "${processName}" has been activated successfully!`;
          
        this.snackBar.open(message, 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        
        console.log(`Process ${action} successful:`, response);
      },
      error: (error) => {
        this.suspending = false;
        console.error(`Process ${action} failed:`, error);
        
        let errorMessage = `Failed to ${actionText} process definition`;
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.snackBar.open(errorMessage, 'Close', {
          duration: 7000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  deleteProcess(): void {
    if (!this.processDefinition) return;

    const processName = this.processDefinition.name || this.processDefinition.key;
    
    // Show confirmation dialog
    const confirmed = confirm(
      `Are you sure you want to delete the process definition "${processName}"?\n\n` +
      `This action cannot be undone and will permanently remove the process definition from the server.`
    );

    if (!confirmed) return;

    this.deleting = true;
    
    this.processDefinitionService.deleteProcessDefinition(this.processDefinition.id).subscribe({
      next: (response) => {
        this.deleting = false;
        
        this.snackBar.open(`Process "${processName}" has been deleted successfully!`, 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        
        console.log('Process deletion successful:', response);
        
        // Navigate back to the list after successful deletion
        this.router.navigate(['/processes']);
      },
      error: (error) => {
        this.deleting = false;
        console.error('Process deletion failed:', error);
        
        let errorMessage = 'Failed to delete process definition';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.snackBar.open(errorMessage, 'Close', {
          duration: 7000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}