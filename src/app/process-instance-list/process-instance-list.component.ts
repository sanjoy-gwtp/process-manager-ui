import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { ProcessInstance } from '../models/process-instance.model';
import { ProcessDefinitionService } from '../services/process-definition.service';

@Component({
  selector: 'app-process-instance-list',
  templateUrl: './process-instance-list.component.html',
  styleUrls: ['./process-instance-list.component.css'],
  standalone: false
})
export class ProcessInstanceListComponent implements OnInit {
  processInstances: ProcessInstance[] = [];
  dataSource = new MatTableDataSource<ProcessInstance>([]);
  loading = false;
  error: string | null = null;

  displayedColumns: string[] = [
    'processName', 
    'instanceId', 
    'version', 
    'startTime', 
    'status', 
    'businessKey', 
    'activity', 
    'actions'
  ];

  constructor(
    private processDefinitionService: ProcessDefinitionService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadProcessInstances();
  }

  loadProcessInstances(): void {
    this.loading = true;
    this.error = null;

    this.processDefinitionService.getProcessInstances().subscribe({
      next: (data) => {
        this.processInstances = data;
        this.dataSource.data = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load process instances';
        this.loading = false;
        console.error('Error loading process instances:', err);
      }
    });
  }

  formatStartTime(startTime: number[]): string {
    if (!startTime || startTime.length < 6) {
      return 'Unknown';
    }
    
    // Convert array format [year, month, day, hour, minute, second, nanosecond] to Date
    const [year, month, day, hour, minute, second] = startTime;
    const date = new Date(year, month - 1, day, hour, minute, second);
    
    return date.toLocaleString();
  }

  getStatusColor(instance: ProcessInstance): string {
    if (instance.ended) {
      return 'basic';
    } else if (instance.suspended) {
      return 'warn';
    } else {
      return 'primary';
    }
  }

  getStatusIcon(instance: ProcessInstance): string {
    if (instance.ended) {
      return 'check_circle';
    } else if (instance.suspended) {
      return 'pause_circle';
    } else {
      return 'play_circle';
    }
  }

  getStatusText(instance: ProcessInstance): string {
    if (instance.ended) {
      return 'Completed';
    } else if (instance.suspended) {
      return 'Suspended';
    } else {
      return 'Running';
    }
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open('Instance ID copied to clipboard', 'Close', {
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

  viewInstanceDetails(instance: ProcessInstance): void {
    this.router.navigate(['/instances', instance.id]);
  }

  viewProcessDiagram(instance: ProcessInstance): void {
    this.router.navigate(['/diagram'], { 
      queryParams: { 
        processId: instance.processDefinitionId,
        processName: instance.processDefinitionName || instance.processDefinitionKey,
        instanceId: instance.id
      } 
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  toggleInstanceSuspension(instance: ProcessInstance): void {
    // TODO: Implement instance suspension/activation
    const action = instance.suspended ? 'activate' : 'suspend';
    console.log(`${action} instance:`, instance);
    this.snackBar.open(`Instance ${action} not implemented yet`, 'Close', {
      duration: 3000
    });
  }
}