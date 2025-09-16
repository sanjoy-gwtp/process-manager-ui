import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormDeploymentService } from '../services/form-deployment.service';

export interface FlowableForm {
  id: string;
  key: string;
  name: string;
  description?: string;
  version: number;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  deployed: boolean;
  hasSchema: boolean;
}

@Component({
  selector: 'app-form-list',
  templateUrl: './form-list.component.html',
  styleUrls: ['./form-list.component.css'],
  standalone: false
})
export class FormListComponent implements OnInit {
  forms: FlowableForm[] = [];
  loading = false;
  error: string | null = null;
  displayedColumns: string[] = ['name', 'key', 'version', 'description', 'createdDate', 'deployed', 'actions'];

  constructor(
    private formDeploymentService: FormDeploymentService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadForms();
  }

  loadForms(): void {
    this.loading = true;
    this.error = null;
    
    console.log('Loading forms from API: /api/flowable-forms/list');
    
    this.formDeploymentService.getAllForms().subscribe({
      next: (data) => {
        console.log('🔍 Forms API response received:', data);
        console.log('📊 Response type:', typeof data);
        console.log('📋 Response is array:', Array.isArray(data));
        console.log('📏 Response length:', data?.length || 'N/A');
        
        this.forms = this.mapApiResponseToForms(data);
        
        console.log('✅ Mapped forms:', this.forms);
        console.log('🔢 Forms array length:', this.forms.length);
        console.log('📝 First form (if any):', this.forms[0]);
        
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load forms';
        this.loading = false;
        console.error('Error loading forms:', err);
        
        this.snackBar.open(
          'Failed to load forms from server',
          'Close',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }

  /**
   * Maps the API response to the FlowableForm interface
   */
  private mapApiResponseToForms(apiData: any): FlowableForm[] {
    console.log('🔄 Starting mapApiResponseToForms with data:', apiData);
    
    if (!apiData) {
      console.warn('⚠️ API response is null/undefined');
      return [];
    }
    
    // Handle different response formats
    let dataArray: any[] = [];
    
    if (Array.isArray(apiData)) {
      console.log('✅ API response is already an array');
      dataArray = apiData;
    } else if (apiData.data && Array.isArray(apiData.data)) {
      console.log('✅ API response has data property (array)');
      dataArray = apiData.data;
    } else if (apiData.forms && Array.isArray(apiData.forms)) {
      console.log('✅ API response has forms property (array)');
      dataArray = apiData.forms;
    } else if (apiData.content && Array.isArray(apiData.content)) {
      console.log('✅ API response has content property (array)');
      dataArray = apiData.content;
    } else {
      console.warn('⚠️ API response format not recognized:', apiData);
      console.log('Available properties:', Object.keys(apiData));
      return [];
    }

    console.log(`🔢 Processing ${dataArray.length} items`);

    const mappedForms = dataArray.map((item: any, index: number) => {
      console.log(`📝 Mapping item ${index}:`, item);
      
      const mappedForm = {
        id: item.id || item.formId || item.deploymentId || `form_${index}`,
        key: item.formKey || item.key || `unknown_key_${index}`,
        name: item.name || item.formName || item.title || item.formKey || `Form ${index + 1}`,
        description: item.description || item.desc || item.summary || '',
        version: item.version || item.formVersion || 1,
        createdBy: item.createdBy || item.creator || item.author || 'System',
        createdDate: this.formatApiDate(item.createdDate || item.createdAt || item.created),
        lastModifiedBy: item.lastModifiedBy || item.modifier || item.updatedBy || item.createdBy || 'System',
        lastModifiedDate: this.formatApiDate(item.lastModified || item.lastModifiedDate || item.lastModifiedAt || item.updated || item.createdDate || item.created),
        deployed: item.status === 'DEPLOYED' || item.deployed !== false, // Check for DEPLOYED status
        hasSchema: !!item.schema || !!item.formSchema // Check if schema exists
      };
      
      console.log(`✅ Mapped form ${index}:`, mappedForm);
      return mappedForm;
    });

    console.log('🎯 Final mapped forms:', mappedForms);
    return mappedForms;
  }

  refresh(): void {
    this.loadForms();
  }

  createNewForm(): void {
    // Navigate to form editor in create mode
    this.router.navigate(['/form'], {
      queryParams: {
        mode: 'editor',
        taskId: 'new_form',
        formName: 'New Form'
      }
    });
  }

  editForm(form: FlowableForm): void {
    // Navigate to form editor with existing form key
    this.router.navigate(['/form'], {
      queryParams: {
        mode: 'editor',
        taskId: form.key.replace('_form', ''), // Convert form key back to task ID format
        formName: form.name,
        formKey: form.key
      }
    });
  }

  viewForm(form: FlowableForm): void {
    // Navigate to form viewer
    this.router.navigate(['/form'], {
      queryParams: {
        mode: 'viewer',
        taskId: form.key.replace('_form', ''),
        formName: form.name,
        formKey: form.key
      }
    });
  }

  duplicateForm(form: FlowableForm): void {
    // Create a new form based on existing form
    const newFormKey = `${form.key}_copy`;
    this.router.navigate(['/form'], {
      queryParams: {
        mode: 'editor',
        taskId: newFormKey.replace('_form', ''),
        formName: `${form.name} (Copy)`,
        formKey: form.key, // Load from existing form
        copyMode: 'true'
      }
    });
  }

  deleteForm(form: FlowableForm): void {
    const confirmed = confirm(
      `Are you sure you want to delete the form "${form.name}"?\n\n` +
      `Form Key: ${form.key}\n` +
      `Version: ${form.version}\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    console.log('Deleting form:', form);

    this.formDeploymentService.deleteForm(form.key).subscribe({
      next: (response) => {
        console.log('Form deleted successfully:', response);
        
        this.snackBar.open(
          `Form "${form.name}" deleted successfully`,
          'Close',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );

        // Refresh the list
        this.loadForms();
      },
      error: (err) => {
        console.error('Error deleting form:', err);
        
        this.snackBar.open(
          `Failed to delete form "${form.name}": ${err.error?.message || err.message || 'Unknown error'}`,
          'Close',
          { duration: 7000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Invalid Date';
    }
  }

  getStatusColor(form: FlowableForm): string {
    return form.deployed ? 'primary' : 'warn';
  }

  getStatusIcon(form: FlowableForm): string {
    return form.deployed ? 'check_circle' : 'warning';
  }

  getStatusText(form: FlowableForm): string {
    return form.deployed ? 'Deployed' : 'Draft';
  }

  copyFormKey(form: FlowableForm): void {
    navigator.clipboard.writeText(form.key).then(() => {
      this.snackBar.open(`Form key "${form.key}" copied to clipboard`, 'Close', {
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

  /**
   * Converts API date format (array) to ISO string
   * API returns dates as arrays like [2025,9,2,17,26,43,342772061]
   */
  private formatApiDate(dateValue: any): string {
    if (!dateValue) {
      return new Date().toISOString();
    }

    // If it's already a string, return it
    if (typeof dateValue === 'string') {
      return dateValue;
    }

    // If it's an array (Flowable format), convert to Date
    if (Array.isArray(dateValue) && dateValue.length >= 6) {
      try {
        // Array format: [year, month, day, hour, minute, second, nanosecond]
        const [year, month, day, hour, minute, second] = dateValue;
        const date = new Date(year, month - 1, day, hour, minute, second); // month is 0-indexed in JS
        return date.toISOString();
      } catch (e) {
        console.warn('Failed to parse API date array:', dateValue, e);
        return new Date().toISOString();
      }
    }

    // Fallback: try to create a Date object
    try {
      return new Date(dateValue).toISOString();
    } catch (e) {
      console.warn('Failed to parse date value:', dateValue, e);
      return new Date().toISOString();
    }
  }
}