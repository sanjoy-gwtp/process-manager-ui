import {AfterContentInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Form } from '@bpmn-io/form-js';
import { FormEditor } from '@bpmn-io/form-js-editor';
import { FormMappingService, FormTaskMapping, FormSubmissionData } from '../services/form-mapping.service';
import { FormDeploymentService, FormDeploymentRequest } from '../services/form-deployment.service';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css'],
  standalone: false
})
export class FormComponent implements OnInit, AfterContentInit, OnDestroy {

  /**
   * form-js instances for creating and editing forms
   */
   formViewer: Form | null = null;
   formEditor: FormEditor | null = null;
   loading = false;
   error: string | null = null;
   formId: string | null = null;
   formName: string | null = null;
   currentMode: 'editor' | 'viewer' = 'viewer';
   currentFormData: any = {};
   currentSchema: any = null;
  taskId: string | null = null;
  processInstanceId: string | null = null;
  processName: string | null = null;
  taskMapping: FormTaskMapping | null = null;
  formExists: boolean = false;
  isDeploying: boolean = false;

  // retrieve DOM element references
  @ViewChild('formEditorRef', {static: true}) formEditorRef: ElementRef | undefined;
  @ViewChild('formViewerRef', {static: true}) formViewerRef: ElementRef | undefined;

  private defaultSchema = {
    type: 'default',
    id: 'form_1',
    components: [
      {
        key: 'textfield_1',
        label: 'Name',
        type: 'textfield',
        validate: {
          required: true
        }
      },
      {
        key: 'email_1',
        label: 'Email',
        type: 'textfield',
        subtype: 'email',
        validate: {
          required: true
        }
      },
      {
        key: 'textarea_1',
        label: 'Message',
        type: 'textarea',
        rows: 4
      },
      {
        key: 'select_1',
        label: 'Priority',
        type: 'select',
        values: [
          {
            label: 'Low',
            value: 'low'
          },
          {
            label: 'Medium',
            value: 'medium'
          },
          {
            label: 'High',
            value: 'high'
          }
        ]
      },
      {
        key: 'checkbox_1',
        label: 'I agree to the terms',
        type: 'checkbox',
        validate: {
          required: true
        }
      }
    ]
  };

  private sampleData = {
    textfield_1: 'John Doe',
    email_1: 'john.doe@example.com',
    textarea_1: 'This is a sample message for testing the form.',
    select_1: 'high',
    checkbox_1: true
  };

  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private formMappingService: FormMappingService,
    private formDeploymentService: FormDeploymentService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.formId = params['formId'];
      this.formName = params['formName'] || 'New Form';
      this.taskId = params['taskId'];
      this.processInstanceId = params['processInstanceId'];
      
      // Parse process name from processInstanceId if not provided explicitly
      if (params['processName']) {
        this.processName = params['processName'];
        console.log('Using processName from params:', this.processName);
      } else if (this.processInstanceId) {
        // Parse process information to generate display name
        console.log('Parsing processInstanceId:', this.processInstanceId);
        const processInfo = this.formDeploymentService.parseProcessInfo(this.processInstanceId);
        this.processName = processInfo.displayName;
        console.log('Parsed process info:', processInfo);
        console.log('Set processName to:', this.processName);
      } else {
        console.log('No processInstanceId available for parsing');
      }
      
      const mode = params['mode'];
      if (mode === 'editor') {
        this.currentMode = mode;
      } else {
        this.currentMode = 'viewer';
      }
      
      // If taskId is provided, load form for the task
      if (this.taskId) {
        this.loadFormForUserTask(this.taskId);
      }
    });
  }

  ngAfterContentInit(): void {
    console.log('ngAfterContentInit called');
    console.log('ViewChild elements:', {
      editor: this.formEditorRef?.nativeElement,
      viewer: this.formViewerRef?.nativeElement
    });
    
    // Use a longer timeout to ensure the DOM and CSS are fully ready
    setTimeout(() => {
      this.initializeForm();
    }, 500);
  }

  async initializeForm(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;

      console.log(`Initializing form in ${this.currentMode} mode...`);
      console.log('Form classes available:', {
        Form: Form,
        FormEditor: FormEditor
      });

      // Add delay to ensure DOM is ready and CSS is applied
      await new Promise(resolve => setTimeout(resolve, 200));

      // Try to initialize in viewer mode first as it's simpler
      if (this.currentMode === 'viewer') {
        await this.initializeViewer();
      } else if (this.currentMode === 'editor') {
        await this.initializeEditor();
      }
      
      this.loading = false;
      
      this.snackBar.open(
        `Form ${this.currentMode} loaded successfully!`,
        'Close',
        { duration: 3000 }
      );

    } catch (err: any) {
      this.error = `Failed to initialize form: ${err.message || err}`;
      this.loading = false;
      console.error('Error initializing form:', err);
      console.error('Error stack:', err.stack);
      
      this.snackBar.open(
        `Initialization failed: ${err.message || 'Unknown error'}`,
        'Close',
        { duration: 5000 }
      );
    }
  }

  private async initializeEditor(): Promise<void> {
    console.log('Initializing form editor...');
    const container = this.formEditorRef?.nativeElement;
    
    console.log('Editor container:', container);
    console.log('Container dimensions:', container?.offsetWidth, 'x', container?.offsetHeight);
    console.log('Container styles:', window.getComputedStyle(container));
    console.log('Container parent:', container?.parentElement);
    console.log('Parent dimensions:', container?.parentElement?.offsetWidth, 'x', container?.parentElement?.offsetHeight);
    console.log('Container classList:', container?.classList.toString());
    console.log('Parent classList:', container?.parentElement?.classList.toString());
    console.log('Container in DOM:', document.contains(container));
    console.log('Container display:', window.getComputedStyle(container).display);
    console.log('Container visibility:', window.getComputedStyle(container).visibility);
    
    if (!container) {
      throw new Error('Form editor container not found - ViewChild may not be initialized');
    }

    // Check if container has dimensions, but don't force them immediately
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      console.log('Container has no dimensions initially, waiting for layout...');
      
      // Wait a bit more for layout to settle
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('After waiting:', container.offsetWidth, 'x', container.offsetHeight);
      
      // Only force dimensions if still zero after waiting
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        console.log('Container still has no dimensions, this might be due to mode switching issues');
        // Don't throw error immediately, let the form-js library handle it
        console.warn('Proceeding with zero dimensions - form-js may handle this internally');
      }
    }

    // Clear container content
    container.innerHTML = '';

    console.log('Creating FormEditor instance...');
    this.formEditor = new FormEditor({
      container: container
    });

    console.log('FormEditor created:', this.formEditor);

    // Set up event listeners for editor
    this.setupEditorListeners();

    // Use current schema if already loaded, otherwise use default
    const schemaToImport = this.currentSchema || this.defaultSchema;
    console.log('Importing schema into editor:', schemaToImport === this.currentSchema ? 'server schema' : 'default schema');
    
    // Validate and sanitize schema before importing
    const validSchema = this.validateAndSanitizeSchema(schemaToImport);
    
    await this.formEditor.importSchema(validSchema);
    this.currentSchema = validSchema;
    
    console.log('Form editor initialized successfully');
  }

  private async initializeViewer(): Promise<void> {
    console.log('Initializing form viewer...');
    const container = this.formViewerRef?.nativeElement;
    
    console.log('Viewer container:', container);
    console.log('Viewer container dimensions:', container?.offsetWidth, 'x', container?.offsetHeight);
    
    if (!container) {
      throw new Error('Form viewer container not found');
    }

    // Clear container content
    container.innerHTML = '';

    this.formViewer = new Form({
      container: container
    });

    console.log('FormViewer created:', this.formViewer);

    // Set up event listeners for viewer
    this.setupViewerListeners();

    // Use current schema if already loaded, otherwise use default
    const schemaToImport = this.currentSchema || this.defaultSchema;
    console.log('Importing schema into viewer:', schemaToImport === this.currentSchema ? 'server schema' : 'default schema');
    
    // Validate and sanitize schema before importing
    const validSchema = this.validateAndSanitizeSchema(schemaToImport);
    console.log('Validated schema:', validSchema);
    console.log('Data:', this.currentFormData);
    
    // Import the validated schema with data
    await this.formViewer.importSchema(validSchema, this.currentFormData);
    this.currentSchema = validSchema;
    
    console.log('Form viewer initialized successfully');
  }


  private setupEditorListeners(): void {
    if (!this.formEditor) return;

    // Listen for schema changes in editor
    this.formEditor.on('schemaChanged', (event: any) => {
      this.currentSchema = event.schema;
      console.log('Schema changed:', event.schema);
    });

    // Listen for form element selection
    this.formEditor.on('selection.changed', (event: any) => {
      console.log('Selection changed:', event);
    });
  }

  private setupViewerListeners(): void {
    if (!this.formViewer) return;

    // Listen for form changes
    this.formViewer.on('changed', (event: any) => {
      this.currentFormData = {...event.data};
    });

    // Listen for form submit events
    this.formViewer.on('submit', (event: any) => {
      console.log('Form submitted:', event.data);
      this.currentFormData = {...event.data};
      
      this.snackBar.open(
        'Form submitted! Check console for data.',
        'Close',
        { duration: 3000 }
      );
    });
  }


  /**
   * Exports the current form schema as a JSON file
   */
  async exportForm(): Promise<void> {
    if ((!this.formEditor && !this.formViewer) || !this.currentSchema) {
      this.snackBar.open('Form not initialized', 'Close', { duration: 3000 });
      return;
    }

    try {
      let exportSchema = this.currentSchema;
      
      // If in editor mode, get the current schema from the editor
      if (this.currentMode === 'editor' && this.formEditor) {
        exportSchema = this.formEditor.saveSchema();
      }

      const exportData = {
        schema: exportSchema,
        data: this.currentFormData,
        exportedAt: new Date().toISOString(),
        formName: this.formName
      };

      // Create a Blob from the JSON data
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
      const url = window.URL.createObjectURL(blob);

      // Create a download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.formName || 'form'}.json`;
      a.style.display = 'none';

      // Append the link, trigger download, and clean up
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Revoke the object URL after a short delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      
      this.snackBar.open('Form exported successfully!', 'Close', { duration: 3000 });

    } catch (err) {
      console.error('Error exporting form:', err);
      this.snackBar.open('Failed to export form', 'Close', { duration: 3000 });
    }
  }

  /**
   * Imports a form schema from a file
   */
  importForm(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importData = JSON.parse(text);
        
        if (importData.schema) {
          this.currentSchema = importData.schema;
          this.currentFormData = importData.data || {};
          this.formName = importData.formName || 'Imported Form';

          // Import into current mode
          if (this.currentMode === 'editor' && this.formEditor) {
            await this.formEditor.importSchema(this.currentSchema);
          } else if (this.currentMode === 'viewer' && this.formViewer) {
            await this.formViewer.importSchema(this.currentSchema, this.currentFormData);
          }
          
          this.snackBar.open('Form imported successfully!', 'Close', { duration: 3000 });
        } else {
          throw new Error('Invalid form file format');
        }
      } catch (err) {
        console.error('Error importing form:', err);
        this.snackBar.open('Failed to import form. Please check the file format.', 'Close', { duration: 5000 });
      }
    };
    input.click();
  }

  /**
   * Resets the form to its default state
   */
  async resetForm(): Promise<void> {
    try {
      this.currentSchema = this.defaultSchema;
      this.currentFormData = {...this.sampleData};
      this.formName = 'New Form';

      if (this.currentMode === 'editor' && this.formEditor) {
        await this.formEditor.importSchema(this.defaultSchema);
      } else if (this.currentMode === 'viewer' && this.formViewer) {
        await this.formViewer.importSchema(this.defaultSchema, {});
      }
      
      this.snackBar.open('Form reset successfully!', 'Close', { duration: 3000 });
    } catch (err) {
      console.error('Error resetting form:', err);
      this.snackBar.open('Failed to reset form', 'Close', { duration: 3000 });
    }
  }

  /**
   * Switches between editor and viewer modes
   */
  async switchMode(mode: 'editor' | 'viewer'): Promise<void> {
    if (this.currentMode === mode) return;

    try {
      // Save current schema if in editor mode
      if (this.currentMode === 'editor' && this.formEditor) {
        this.currentSchema = this.formEditor.saveSchema();
      }

      // Destroy current instances and reset containers
      if (this.formEditor) {
        this.formEditor.destroy();
        this.formEditor = null;
      }
      if (this.formViewer) {
        this.formViewer.destroy();
        this.formViewer = null;
      }

      // Clean up and reset all containers 
      this.resetAllContainers();

      this.currentMode = mode;

      // Add delay after container reset to ensure DOM is clean
      await new Promise(resolve => setTimeout(resolve, 300));

      // Initialize new mode
      if (mode === 'editor') {
        await this.initializeEditor();
      } else if (mode === 'viewer') {
        await this.initializeViewer();
      }
      
      this.snackBar.open(`Switched to ${mode} mode`, 'Close', { duration: 2000 });
      
    } catch (err) {
      console.error('Error switching mode:', err);
      this.snackBar.open('Failed to switch mode', 'Close', { duration: 3000 });
    }
  }

  /**
   * Resets all form containers to clean state
   */
  private resetAllContainers(): void {
    console.log('Resetting all containers...');
    
    // Reset editor container
    if (this.formEditorRef?.nativeElement) {
      const editorContainer = this.formEditorRef.nativeElement;
      editorContainer.innerHTML = '';
      editorContainer.removeAttribute('style');
      editorContainer.className = 'form-editor-container';
    }
    
    // Reset viewer container  
    if (this.formViewerRef?.nativeElement) {
      const viewerContainer = this.formViewerRef.nativeElement;
      viewerContainer.innerHTML = '';
      viewerContainer.removeAttribute('style');
      viewerContainer.className = 'form-viewer-container';
    }
    
    // Reset wrapper containers
    const editorWrapper = this.formEditorRef?.nativeElement?.parentElement;
    const viewerWrapper = this.formViewerRef?.nativeElement?.parentElement;
    
    [editorWrapper, viewerWrapper].forEach(wrapper => {
      if (wrapper) {
        wrapper.removeAttribute('style');
        // Reset classes but keep the original wrapper classes
        const originalClasses = wrapper.className.split(' ').filter(cls => 
          cls.includes('form-wrapper') || 
          cls.includes('editor-wrapper') || 
          cls.includes('viewer-wrapper')
        );
        wrapper.className = originalClasses.join(' ');
      }
    });
    
    console.log('All containers reset to clean state');
  }

  /**
   * Gets the current form data for preview
   */
  previewData(): void {
    try {
      let currentSchema = this.currentSchema;
      
      // If in editor mode, get current schema from editor
      if (this.currentMode === 'editor' && this.formEditor) {
        currentSchema = this.formEditor.saveSchema();
        this.currentSchema = currentSchema;
      }

      console.log('Form Schema:', currentSchema);
      console.log('Form Data:', this.currentFormData);
      
      this.snackBar.open('Form data logged to console', 'Close', { duration: 3000 });
    } catch (err) {
      console.error('Error getting form data:', err);
      this.snackBar.open('Failed to get form data', 'Close', { duration: 3000 });
    }
  }


  /**
   * Loads form for a User Task in editor mode
   */
  loadFormForUserTask(taskId: string): void {
    this.loading = true;
    this.error = null;

    console.log('Loading form for User Task (bypassing task API calls):', taskId);

    // Generate form key from task ID
    const formKey = this.formDeploymentService.generateFormKey(taskId);
    
    // Set basic task information without API calls
    this.taskMapping = {
      taskId: taskId,
      processInstanceId: this.processInstanceId || 'unknown',
      formKey: formKey,
      formType: 'custom',
      variables: {}
    };
    
    // Use form key as form name
    this.formName = formKey;
    
    console.log('Generated form key:', formKey);
    console.log('Using form name:', this.formName);
    
    // Check if form exists on server and load it (bypassing task APIs)
    this.loadFormFromServerOrCreateNew(formKey);
  }

  /**
   * Loads form from server or creates a new blank form using /exists endpoint
   */
  private loadFormFromServerOrCreateNew(formKey: string): void {
    console.log(`Checking form existence: ${formKey}`);
    
    // First, check if form exists using dedicated /exists endpoint
    this.formDeploymentService.checkFormExists(formKey).subscribe({
      next: (exists) => {
        console.log(`Form "${formKey}" exists:`, exists);
        this.formExists = exists;
        
        if (exists) {
          // ✅ FORM EXISTS: Load schema from server
          console.log(`✅ Form exists on server - loading schema from API: ${formKey}`);
          this.formDeploymentService.getFormSchema(formKey).subscribe({
            next: (schema) => {
              this.currentSchema = schema;
              this.currentFormData = {};
              this.loading = false;
              
              // Import the loaded schema into the form editor for editing
              this.importSchemaIntoEditor(schema);
              
              this.snackBar.open(
                `✅ Loaded server schema: ${formKey}`,
                'Close',
                { duration: 3000 }
              );
              console.log('✅ SUCCESS: Using server schema for editing:', schema);
            },
            error: (err) => {
              // Fallback to default schema if loading existing form fails
              console.warn(`Failed to load existing form schema ${formKey}, using default:`, err);
              this.currentSchema = this.defaultSchema;
              this.currentFormData = {};
              this.loading = false;
              
              this.snackBar.open(
                `Failed to load form "${formKey}" - using default template`,
                'Close',
                { duration: 4000 }
              );
            }
          });
        } else {
          // ❌ FORM DOESN'T EXIST: Use default schema
          console.log(`❌ Form does not exist on server - using default schema: ${formKey}`);
          this.currentSchema = this.defaultSchema;
          this.currentFormData = {};
          this.loading = false;
          
          this.snackBar.open(
            `📝 Creating new form "${formKey}" - using default template`,
            'Close',
            { duration: 4000 }
          );
          console.log('📝 SUCCESS: Using default schema');
        }
      },
      error: (err) => {
        // 🚫 SERVER ERROR: Fallback to default schema
        console.warn(`🚫 Server unavailable - using default schema for ${formKey}:`, err);
        this.formExists = false;
        this.currentSchema = this.defaultSchema;
        this.currentFormData = {};
        this.loading = false;
        
        this.snackBar.open(
          `📝 Creating new form "${formKey}" - server unavailable`,
          'Close',
          { duration: 3000 }
        );
        console.log('📝 FALLBACK: Using default schema due to server error');
      }
    });
  }

  /**
   * Validates and sanitizes form schema before importing
   */
  private validateAndSanitizeSchema(schema: any): any {
    if (!schema || typeof schema !== 'object') {
      console.warn('Invalid schema provided, using default schema');
      return this.defaultSchema;
    }

    // Ensure schema has required structure
    const sanitizedSchema: any = {
      type: schema.type || 'default',
      id: schema.id || `form_${Date.now()}`,
      components: []
    };

    // Validate and sanitize components
    if (Array.isArray(schema.components)) {
      const usedKeys = new Set<string>();
      
      sanitizedSchema.components = schema.components.map((component: any, index: number) => {
        const sanitizedComponent = { ...component };
        
        // Ensure component has required fields
        if (!sanitizedComponent.key) {
          sanitizedComponent.key = `field_${index + 1}`;
          console.warn(`Component ${index} missing key, generated: ${sanitizedComponent.key}`);
        }
        
        // Ensure unique keys
        let originalKey = sanitizedComponent.key;
        let uniqueKey = originalKey;
        let counter = 1;
        
        while (usedKeys.has(uniqueKey)) {
          uniqueKey = `${originalKey}_${counter}`;
          counter++;
        }
        
        if (uniqueKey !== originalKey) {
          console.warn(`Component key conflict detected: "${originalKey}" changed to "${uniqueKey}"`);
          sanitizedComponent.key = uniqueKey;
        }
        
        usedKeys.add(sanitizedComponent.key);
        
        if (!sanitizedComponent.type) {
          sanitizedComponent.type = 'textfield';
          console.warn(`Component ${sanitizedComponent.key} missing type, defaulted to: textfield`);
        }
        
        if (!sanitizedComponent.label) {
          sanitizedComponent.label = sanitizedComponent.key.charAt(0).toUpperCase() + sanitizedComponent.key.slice(1).replace(/_/g, ' ');
          console.warn(`Component ${sanitizedComponent.key} missing label, generated: ${sanitizedComponent.label}`);
        }

        // Map unsupported types to supported ones
        const typeMapping: { [key: string]: string } = {
          'string': 'textfield',
          'text': 'textfield',
          'input': 'textfield',
          'boolean': 'checkbox',
          'bool': 'checkbox',
          'date': 'datetime',
          'time': 'datetime',
          'timestamp': 'datetime',
          'integer': 'number',
          'int': 'number',
          'long': 'number',
          'double': 'number',
          'float': 'number',
          'decimal': 'number',
          'enum': 'select',
          'choice': 'select',
          'list': 'select',
          'multi': 'select',
          'multiselect': 'select',
          'radio': 'radio',
          'radiogroup': 'radio',
          'file': 'file',
          'upload': 'file',
          'attachment': 'file'
        };

        if (typeMapping[sanitizedComponent.type]) {
          const originalType = sanitizedComponent.type;
          sanitizedComponent.type = typeMapping[originalType];
          console.log(`Mapped component type: ${originalType} → ${sanitizedComponent.type}`);
        }

        // Validate supported form.js types
        const supportedTypes = [
          'textfield', 'textarea', 'number', 'checkbox', 'radio', 
          'select', 'datetime', 'button', 'file', 'columns', 
          'fieldset', 'panel', 'well', 'tabs', 'table'
        ];

        if (!supportedTypes.includes(sanitizedComponent.type)) {
          console.warn(`Unsupported component type: ${sanitizedComponent.type}, defaulting to textfield`);
          sanitizedComponent.type = 'textfield';
        }

        // Log layout information but don't remove it yet - let's see if it's the real issue
        if (sanitizedComponent.layout) {
          console.log(`📐 Layout found for component ${sanitizedComponent.key}:`, sanitizedComponent.layout);
          // Temporarily keeping layout to debug the real issue
        }

        // Remove other potential problematic properties
        if (sanitizedComponent.id && typeof sanitizedComponent.id === 'string' && sanitizedComponent.id.startsWith('Field_')) {
          console.log(`Keeping Form.js ID for component ${sanitizedComponent.key}: ${sanitizedComponent.id}`);
          // Keep the ID as it might be used by Form.js internally
        }

        return sanitizedComponent;
      }).filter(component => component !== null);
    }

    // Ensure at least one component exists
    if (sanitizedSchema.components.length === 0) {
      console.warn('Schema has no valid components, adding default textfield');
      sanitizedSchema.components = [{
        key: 'textfield_1',
        label: 'Name',
        type: 'textfield',
        validate: { required: true }
      }];
    }

    console.log('🔍 Schema validation complete:');
    console.log('📊 Component counts:', {
      original: schema.components?.length || 0,
      sanitized: sanitizedSchema.components?.length || 0
    });
    console.log('🔑 Component keys:', {
      original: schema.components?.map((c: any) => `${c.key} (${c.type})`) || [],
      sanitized: sanitizedSchema.components?.map((c: any) => `${c.key} (${c.type})`) || []
    });
    console.log('📋 Full sanitized schema:', JSON.stringify(sanitizedSchema, null, 2));

    return sanitizedSchema;
  }

  /**
   * Imports schema into the form editor for editing
   */
  private async importSchemaIntoEditor(schema: any): Promise<void> {
    try {
      // Validate and sanitize schema before importing
      const validSchema = this.validateAndSanitizeSchema(schema);
      
      if (this.currentMode === 'editor' && this.formEditor) {
        console.log('Importing validated schema into form editor:', validSchema);
        console.log('Component count before import:', validSchema.components?.length);
        console.log('Components to import:', validSchema.components?.map((c: any) => ({ key: c.key, type: c.type, label: c.label })));
        
        await this.formEditor.importSchema(validSchema);
        
        console.log('✅ Successfully imported validated schema into editor');
        
        // Add a delay to allow DOM rendering to complete
        setTimeout(() => {
          this.debugFormRendering('editor');
        }, 500);
      } else if (this.currentMode === 'viewer' && this.formViewer) {
        console.log('Importing validated schema into form viewer:', validSchema);
        console.log('Component count before import:', validSchema.components?.length);
        console.log('Components to import:', validSchema.components?.map((c: any) => ({ key: c.key, type: c.type, label: c.label })));
        
        await this.formViewer.importSchema(validSchema, this.currentFormData);
        
        console.log('✅ Successfully imported validated schema into viewer');
        
        // Add a delay to allow DOM rendering to complete
        setTimeout(() => {
          this.debugFormRendering('viewer');
        }, 500);
      } else {
        console.log('Form editor/viewer not ready yet, validated schema will be imported later');
      }
      
      // Update current schema with validated version
      this.currentSchema = validSchema;
    } catch (error) {
      console.error('Failed to import schema into editor:', error);
      // Fallback to default schema
      try {
        const fallbackSchema = this.defaultSchema;
        console.log('Attempting to import fallback default schema');
        
        if (this.currentMode === 'editor' && this.formEditor) {
          await this.formEditor.importSchema(fallbackSchema);
        } else if (this.currentMode === 'viewer' && this.formViewer) {
          await this.formViewer.importSchema(fallbackSchema, this.currentFormData);
        }
        
        this.currentSchema = fallbackSchema;
        console.log('✅ Successfully imported fallback schema');
      } catch (fallbackError) {
        console.error('Failed to import fallback schema:', fallbackError);
        throw new Error('Failed to initialize form with any schema');
      }
    }
  }

  /**
   * Debug method to inspect form rendering in the DOM
   */
  private debugFormRendering(mode: 'editor' | 'viewer'): void {
    console.log(`🔧 Debugging form rendering for ${mode}...`);
    
    const container = mode === 'editor' 
      ? this.formEditorRef?.nativeElement 
      : this.formViewerRef?.nativeElement;
    
    if (!container) {
      console.log(`❌ No container found for ${mode}`);
      return;
    }
    
    // Count visible form elements
    const inputs = container.querySelectorAll('input, textarea, select, button');
    const labels = container.querySelectorAll('label');
    const formGroups = container.querySelectorAll('.form-group, .fjs-form-field, [data-field-id]');
    
    console.log(`📊 DOM inspection for ${mode}:`);
    console.log(`  - Input elements: ${inputs.length}`);
    console.log(`  - Label elements: ${labels.length}`);
    console.log(`  - Form groups: ${formGroups.length}`);
    
    // Log all visible form fields
    formGroups.forEach((group, index) => {
      const fieldId = group.getAttribute('data-field-id') || 
                     group.querySelector('[data-field-id]')?.getAttribute('data-field-id') ||
                     `field-${index}`;
      const label = group.querySelector('label')?.textContent?.trim() || 'No label';
      const input = group.querySelector('input, textarea, select');
      const inputType = input?.getAttribute('type') || input?.tagName?.toLowerCase() || 'none';
      
      console.log(`    [${index}] Field: ${fieldId} | Label: "${label}" | Input: ${inputType}`);
    });
    
    // Check for hidden or overlapping elements
    const hiddenElements = container.querySelectorAll('[style*="display: none"], [hidden], .hidden');
    if (hiddenElements.length > 0) {
      console.log(`⚠️  Found ${hiddenElements.length} hidden elements`);
      hiddenElements.forEach((el, i) => {
        console.log(`    Hidden[${i}]:`, el);
      });
    }
    
    // Check for elements with zero dimensions (might be overlapping)
    const allFormElements = container.querySelectorAll('.form-group, .fjs-form-field, [data-field-id]');
    let zeroSizeCount = 0;
    allFormElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        zeroSizeCount++;
        console.log(`⚠️  Zero-size element:`, el, 'Rect:', rect);
      }
    });
    
    if (zeroSizeCount > 0) {
      console.log(`⚠️  Found ${zeroSizeCount} elements with zero dimensions`);
    }
    
    console.log(`✅ DOM inspection complete for ${mode}`);
  }

  /**
   * Loads form schema from a form key reference
   */
  private loadSchemaFromFormKey(formKey: string): void {
    // This would typically fetch the form schema from your backend
    // Supports Flowable formKey formats like: 
    // - embedded:deployment:forms/approval-form.json
    // - embedded:app:forms/request-form.json
    // - external-form-key-reference
    console.log('Loading schema from Flowable formKey:', formKey);
    
    if (formKey.startsWith('embedded:')) {
      // Handle embedded form references
      console.log('Processing embedded form reference:', formKey);
      this.currentSchema = this.defaultSchema;
    } else {
      // Handle external form key references - load from flowable-forms API
      console.log('Processing external form reference:', formKey);
      this.formDeploymentService.getFormSchema(formKey).subscribe({
        next: (schema) => {
          this.currentSchema = schema;
          console.log('Loaded schema from API:', schema);
        },
        error: (err) => {
          console.warn('Failed to load schema from API, using default:', err);
          this.currentSchema = this.defaultSchema;
        }
      });
    }
  }

  /**
   * Submits form data for task completion
   */
  submitTaskForm(): void {
    if (!this.taskId || !this.processInstanceId || !this.taskMapping) {
      this.snackBar.open('Task information not available', 'Close', { duration: 3000 });
      return;
    }

    // Validate form data
    const validation = this.formMappingService.validateFormData(this.currentFormData, this.currentSchema);
    if (!validation.valid) {
      const errorMessage = `Form validation failed:\n${validation.errors.join('\n')}`;
      this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
      return;
    }

    // Map form data to process variables
    const processVariables = this.formMappingService.mapFormToProcessVariables(this.currentFormData, this.currentSchema);

    const submissionData: FormSubmissionData = {
      taskId: this.taskId,
      processInstanceId: this.processInstanceId,
      variables: processVariables
    };

    this.loading = true;
    this.formMappingService.submitFormData(submissionData).subscribe({
      next: (response) => {
        this.loading = false;
        this.snackBar.open(
          `Task completed successfully! Process continues with next steps.`,
          'Close',
          { 
            duration: 5000,
            panelClass: ['success-snackbar']
          }
        );
        console.log('Task submission successful:', response);
      },
      error: (error) => {
        this.loading = false;
        console.error('Task submission failed:', error);
        
        let errorMessage = 'Failed to submit task';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.snackBar.open(
          errorMessage,
          'Close',
          { 
            duration: 7000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  /**
   * Enhanced submit form method that handles both task and standalone forms
   */
  submitForm(): void {
    if (this.taskId && this.processInstanceId) {
      // This is a task form, handle task completion
      this.submitTaskForm();
    } else {
      // This is a standalone form, use original behavior
      if (this.currentMode === 'editor') {
        this.snackBar.open('Switch to viewer mode to submit the form', 'Close', { duration: 3000 });
        return;
      }

      try {
        // For viewer mode, try to find and click submit button
        const containerRef = this.formViewerRef;
        const submitButton = containerRef?.nativeElement.querySelector('[type="submit"]');
        if (submitButton) {
          submitButton.click();
        } else {
          // If no submit button, just show current data
          this.previewData();
        }
      } catch (err) {
        console.error('Error submitting form:', err);
        this.snackBar.open('Failed to submit form', 'Close', { duration: 3000 });
      }
    }
  }

  /**
   * Deploys the form to the server
   */
  async deployFormToServer(overrideExisting: boolean = false): Promise<void> {
    if (!this.taskId || !this.taskMapping) {
      this.snackBar.open('Task information not available', 'Close', { duration: 3000 });
      return;
    }

    // Get current schema from editor
    let currentSchema = this.currentSchema;
    if (this.currentMode === 'editor' && this.formEditor) {
      try {
        currentSchema = this.formEditor.saveSchema();
      } catch (err) {
        this.snackBar.open('Failed to save form schema from editor', 'Close', { duration: 3000 });
        return;
      }
    }

    // Validate form schema
    const validation = this.formDeploymentService.validateFormSchema(currentSchema);
    if (!validation.valid) {
      const errorMessage = `Form validation failed:\n${validation.errors.join('\n')}`;
      this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
      return;
    }

    this.isDeploying = true;

    // Prepare deployment request
    const formKey = this.taskMapping.formKey || this.formDeploymentService.generateFormKey(this.taskId);
    const deploymentRequest: FormDeploymentRequest = {
      formKey: formKey,
      formName: this.formName || `Form for ${this.taskId}`,
      formSchema: currentSchema,
      taskId: this.taskId,
      processDefinitionId: this.processInstanceId || undefined,
      overrideExisting: overrideExisting
    };

    try {
      let deploymentResult;
      
      console.log('Form deployment details:');
      console.log('- formExists:', this.formExists);
      console.log('- formKey:', formKey);
      console.log('- deploymentRequest:', deploymentRequest);
      
      if (this.formExists) {
        // Update existing form - always use override for updates
        console.log('Using updateForm method for existing form');
        deploymentRequest.overrideExisting = true;
        deploymentResult = await this.formDeploymentService.updateForm(formKey, deploymentRequest).toPromise();
      } else {
        // Deploy new form
        console.log('Using deployForm method for new form');
        deploymentResult = await this.formDeploymentService.deployForm(deploymentRequest).toPromise();
      }
      
      console.log('Deployment result:', deploymentResult);
      this.isDeploying = false;

      if (deploymentResult?.success) {
        this.snackBar.open(
          deploymentResult.message,
          'Close',
          { 
            duration: 4000,
            panelClass: ['success-snackbar']
          }
        );

        // Wait a moment then navigate back to diagram
        setTimeout(() => {
          this.navigateBackToDiagram();
        }, 2000);

      } else if (deploymentResult?.requiresOverride) {
        // Handle override confirmation
        console.log('Override required, showing confirmation dialog');
        this.handleFormOverrideConfirmation(deploymentResult);
      } else {
        console.error('Deployment failed:', deploymentResult);
        this.snackBar.open(
          deploymentResult?.message || 'Deployment failed',
          'Close',
          { 
            duration: 5000,
            panelClass: ['error-snackbar']
          }
        );
      }

    } catch (error) {
      this.isDeploying = false;
      console.error('Deployment error:', error);
      this.snackBar.open(
        'Deployment failed - check console for details',
        'Close',
        { 
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
    }
  }

  /**
   * Handles form override confirmation dialog
   */
  private handleFormOverrideConfirmation(deploymentResult: any): void {
    const formKey = deploymentResult.formKey;
    const errorMessage = deploymentResult.message || 'Form already exists';
    
    console.log('Override confirmation required:', {
      formKey: formKey,
      errorMessage: errorMessage,
      deploymentResult: deploymentResult
    });
    
    // Extract form name from error message if possible
    const formName = this.extractFormNameFromError(errorMessage) || formKey;
    
    const confirmMessage = `Form "${formName}" already exists on the server.\n\nServer message: ${errorMessage}\n\nDo you want to override the existing form with your changes?`;
    
    if (confirm(confirmMessage)) {
      console.log('User confirmed override, redeploying with overrideExisting=true');
      // User confirmed override, redeploy with overrideExisting=true
      this.deployFormToServer(true);
    } else {
      console.log('User cancelled override');
      // User cancelled, show appropriate message
      this.snackBar.open(
        'Form deployment cancelled - existing form was not modified',
        'Close',
        { duration: 4000 }
      );
    }
  }

  /**
   * Extracts form name from error message
   */
  private extractFormNameFromError(errorMessage: string): string | null {
    // Try to extract form name from messages like "Form already exists: approval-form"
    const patterns = [
      /Form already exists:\s*([^\s.]+)/i,
      /exists:\s*([^\s.]+)/i,
      /'([^']+)'/,
      /"([^"]+)"/
    ];

    for (const pattern of patterns) {
      const match = errorMessage.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Saves form as draft without deploying
   */
  async saveFormDraft(): Promise<void> {
    if (!this.taskId || !this.taskMapping) {
      this.snackBar.open('Task information not available', 'Close', { duration: 3000 });
      return;
    }

    // Get current schema from editor
    let currentSchema = this.currentSchema;
    if (this.currentMode === 'editor' && this.formEditor) {
      try {
        currentSchema = this.formEditor.saveSchema();
      } catch (err) {
        this.snackBar.open('Failed to save form schema from editor', 'Close', { duration: 3000 });
        return;
      }
    }

    const formKey = this.taskMapping.formKey || this.formDeploymentService.generateFormKey(this.taskId);

    this.formDeploymentService.saveFormDraft(formKey, currentSchema).subscribe({
      next: (result) => {
        if (result.success) {
          this.snackBar.open(result.message, 'Close', { duration: 3000 });
        } else {
          this.snackBar.open(result.message, 'Close', { duration: 5000 });
        }
      },
      error: (error) => {
        console.error('Draft save error:', error);
        this.snackBar.open('Failed to save draft', 'Close', { duration: 3000 });
      }
    });
  }

  /**
   * Navigates back to the diagram
   */
  navigateBackToDiagram(): void {
    console.log('Form component navigating back to diagram with:', {
      processInstanceId: this.processInstanceId,
      processName: this.processName
    });
    
    this.formDeploymentService.navigateBackToDiagram(
      this.processInstanceId || undefined, 
      this.processName || undefined
    );
  }

  /**
   * Cancels form editing and returns to diagram
   */
  cancelFormEditing(): void {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      this.navigateBackToDiagram();
    }
  }

  /**
   * Shows all available forms from server
   */
  showAvailableForms(): void {
    this.formDeploymentService.getAllForms().subscribe({
      next: (forms) => {
        console.log('Available forms from server:', forms);
        this.snackBar.open(
          `Found ${forms.length} forms on server - check console for details`,
          'Close',
          { duration: 4000 }
        );
      },
      error: (error) => {
        console.error('Failed to get forms list:', error);
        this.snackBar.open('Failed to get forms list from server', 'Close', { duration: 3000 });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.formEditor) {
      this.formEditor.destroy();
    }
    if (this.formViewer) {
      this.formViewer.destroy();
    }
  }
}