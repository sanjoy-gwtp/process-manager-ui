import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DeploymentDialogData {
  currentName?: string;
  title: string;
  message: string;
}

export interface DeploymentDialogResult {
  processName: string;
  confirmed: boolean;
}

@Component({
  selector: 'app-deployment-dialog',
  templateUrl: './deployment-dialog.component.html',
  styleUrls: ['./deployment-dialog.component.css'],
  standalone: false
})
export class DeploymentDialogComponent {
  processName: string = '';

  constructor(
    public dialogRef: MatDialogRef<DeploymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeploymentDialogData
  ) {
    this.processName = data.currentName || '';
  }

  onCancel(): void {
    this.dialogRef.close({ confirmed: false, processName: '' });
  }

  onConfirm(): void {
    if (this.processName.trim()) {
      this.dialogRef.close({ 
        confirmed: true, 
        processName: this.processName.trim() 
      });
    }
  }

  isValid(): boolean {
    return this.processName.trim().length > 0;
  }
}