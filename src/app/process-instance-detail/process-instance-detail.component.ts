import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProcessInstance } from '../models/process-instance.model';
import { ProcessDefinitionService } from '../services/process-definition.service';

@Component({
  selector: 'app-process-instance-detail',
  templateUrl: './process-instance-detail.component.html',
  styleUrls: ['./process-instance-detail.component.css'],
  standalone: false
})
export class ProcessInstanceDetailComponent implements OnInit, OnDestroy {
  processInstance: ProcessInstance | null = null;
  loading = false;
  error: string | null = null;
  instanceId: string = '';
  suspending = false;
  diagramLoading = false;
  diagramError: string | null = null;
  diagramImageUrl: string | null = null;
  diagramLoaded = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private processDefinitionService: ProcessDefinitionService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.instanceId = params['id'];
      if (this.instanceId) {
        this.loadProcessInstance();
      }
    });
  }

  loadProcessInstance(): void {
    this.loading = true;
    this.error = null;

    // Get all process instances and find the specific one
    this.processDefinitionService.getProcessInstances().subscribe({
      next: (data) => {
        const found = data.find(instance => instance.id === this.instanceId);
        if (found) {
          this.processInstance = found;
          this.loading = false;
          // Load the instance diagram after loading the instance details
          this.loadInstanceDiagram();
        } else {
          this.error = 'Process instance not found';
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = 'Failed to load process instance details';
        this.loading = false;
        console.error('Error loading process instance:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/instances']);
  }

  formatStartTime(startTime: number[]): string {
    if (!startTime || startTime.length < 6) {
      return 'Unknown';
    }
    
    const [year, month, day, hour, minute, second] = startTime;
    const date = new Date(year, month - 1, day, hour, minute, second);
    
    return date.toLocaleString();
  }

  calculateDuration(): string {
    if (!this.processInstance?.startTime) {
      return 'Unknown';
    }

    const [year, month, day, hour, minute, second] = this.processInstance.startTime;
    const startDate = new Date(year, month - 1, day, hour, minute, second);
    const now = new Date();
    
    const diffMs = now.getTime() - startDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      const remainingHours = diffHours % 24;
      return `${diffDays}d ${remainingHours}h ${diffMinutes}m`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  }

  getStatusColor(): string {
    if (!this.processInstance) return 'basic';
    
    if (this.processInstance.ended) {
      return 'basic';
    } else if (this.processInstance.suspended) {
      return 'warn';
    } else {
      return 'primary';
    }
  }

  getStatusIcon(): string {
    if (!this.processInstance) return 'help';
    
    if (this.processInstance.ended) {
      return 'check_circle';
    } else if (this.processInstance.suspended) {
      return 'pause_circle';
    } else {
      return 'play_circle';
    }
  }

  getStatusText(): string {
    if (!this.processInstance) return 'Unknown';
    
    if (this.processInstance.ended) {
      return 'Completed';
    } else if (this.processInstance.suspended) {
      return 'Suspended';
    } else {
      return 'Running';
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

  viewDiagram(): void {
    if (this.processInstance) {
      this.router.navigate(['/diagram'], { 
        queryParams: { 
          processId: this.processInstance.processDefinitionId,
          processName: this.processInstance.processDefinitionName || this.processInstance.processDefinitionKey,
          instanceId: this.processInstance.id
        } 
      });
    }
  }

  toggleSuspension(): void {
    if (!this.processInstance) return;

    const instanceName = this.processInstance.processDefinitionName || this.processInstance.processDefinitionKey;
    const action = this.processInstance.suspended ? 'activate' : 'suspend';
    const actionText = this.processInstance.suspended ? 'activate' : 'suspend';
    
    // Show confirmation dialog
    const confirmed = confirm(
      `Are you sure you want to ${actionText} the process instance "${instanceName}"?\n\n` +
      `Instance ID: ${this.processInstance.id.slice(0, 8)}...\n\n` +
      `This will ${this.processInstance.suspended ? 'resume' : 'pause'} the execution of this instance.`
    );

    if (!confirmed) return;

    this.suspending = true;
    
    // TODO: Implement instance suspension/activation API calls
    // For now, just simulate the action
    setTimeout(() => {
      this.suspending = false;
      if (this.processInstance) {
        this.processInstance.suspended = !this.processInstance.suspended;
      }
      
      const message = this.processInstance?.suspended 
        ? `Instance has been suspended successfully!`
        : `Instance has been activated successfully!`;
        
      this.snackBar.open(message, 'Close', {
        duration: 5000,
        panelClass: ['success-snackbar']
      });
    }, 1500);
  }

  terminateInstance(): void {
    if (!this.processInstance) return;

    const instanceName = this.processInstance.processDefinitionName || this.processInstance.processDefinitionKey;
    
    // Show confirmation dialog
    const confirmed = confirm(
      `Are you sure you want to terminate the process instance "${instanceName}"?\n\n` +
      `Instance ID: ${this.processInstance.id.slice(0, 8)}...\n\n` +
      `This action cannot be undone and will permanently stop this process instance.`
    );

    if (!confirmed) return;

    // TODO: Implement instance termination API call
    console.log('Terminate instance:', this.processInstance);
    this.snackBar.open('Instance termination not implemented yet', 'Close', {
      duration: 3000
    });
  }

  loadInstanceDiagram(): void {
    if (!this.instanceId) return;

    this.diagramLoading = true;
    this.diagramError = null;
    this.diagramLoaded = false;

    this.processDefinitionService.getProcessInstanceDiagram(this.instanceId).subscribe({
      next: (blob) => {
        this.diagramLoading = false;
        this.diagramLoaded = true;
        
        // Create object URL from blob for image display
        if (this.diagramImageUrl) {
          URL.revokeObjectURL(this.diagramImageUrl);
        }
        
        this.diagramImageUrl = URL.createObjectURL(blob);
      },
      error: (err) => {
        this.diagramLoading = false;
        this.diagramLoaded = true;
        console.error('Error loading instance diagram:', err);
        
        if (err.status === 404) {
          this.diagramError = 'No diagram available for this process instance';
        } else if (err.status === 400) {
          this.diagramError = 'Invalid process instance ID';
        } else {
          this.diagramError = 'Failed to load process instance diagram';
        }
      }
    });
  }

  onDiagramImageLoad(): void {
    // Image loaded successfully
    this.diagramError = null;
  }

  onDiagramImageError(): void {
    this.diagramError = 'Failed to display diagram image';
    if (this.diagramImageUrl) {
      URL.revokeObjectURL(this.diagramImageUrl);
      this.diagramImageUrl = null;
    }
  }

  ngOnDestroy(): void {
    // Clean up object URL to prevent memory leaks
    if (this.diagramImageUrl) {
      URL.revokeObjectURL(this.diagramImageUrl);
    }
  }
}