import {AfterContentInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
  CamundaPlatformPropertiesProviderModule
} from 'bpmn-js-properties-panel';  
import Modeler from 'bpmn-js/lib/Modeler';
import customPropertiesProvider from '../custom-properties-provider/custom-property-provider';
import {from, Observable} from 'rxjs';
import { ProcessDefinitionService } from '../services/process-definition.service';
import { DeploymentDialogComponent, DeploymentDialogData, DeploymentDialogResult } from '../deployment-dialog/deployment-dialog.component';
import { TaskNavigationService } from '../services/task-navigation.service';
import { FormDeploymentService } from '../services/form-deployment.service';

const custom = require('../custom-properties-provider/descriptors/custom.json');
const flowable = require('../custom-properties-provider/descriptors/flowable.json');

@Component({
  selector: 'app-diagram',
  templateUrl: 'diagram.component.html',
  styleUrls: [
    'diagram.component.css'
  ],
  standalone: false
})
export class DiagramComponent implements OnInit, AfterContentInit, OnDestroy {

  /**
   * You may include a different variant of BpmnJS:
   *
   * bpmn-viewer  - displays BPMN diagrams without the ability
   *                to navigate them
   * bpmn-modeler - bootstraps a full-fledged BPMN editor
   */
   bpmnJS: Modeler;
   loading = false;
   error: string | null = null;
   processId: string | null = null;
   processName: string | null = null;
   instanceId: string | null = null;
   propertiesCollapsed = false;
   deploying = false;

  // retrieve DOM element reference
  @ViewChild('diagramRef', {static: true}) diagramRef: ElementRef | undefined;
  @ViewChild('propertiesRef', {static: true}) propertiesRef: ElementRef | undefined;

  private xml: string = `<?xml version="1.0" encoding="UTF-8"?>
  <bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:flowable="http://flowable.org/bpmn" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn">
    <bpmn2:process id="Process_1" isExecutable="true">
      <bpmn2:startEvent id="StartEvent_1"/>
    </bpmn2:process>
    <bpmndi:BPMNDiagram id="BPMNDiagram_1">
      <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
        <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
          <dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0"/>
        </bpmndi:BPMNShape>
      </bpmndi:BPMNPlane>
    </bpmndi:BPMNDiagram>
  </bpmn2:definitions>`;

  constructor(
    private route: ActivatedRoute,
    private processDefinitionService: ProcessDefinitionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private taskNavigationService: TaskNavigationService,
    private formDeploymentService: FormDeploymentService
  ) {
    this.bpmnJS = new Modeler({
      container: this.diagramRef?.nativeElement,
      propertiesPanel: {
        parent: this.propertiesRef
      },
      additionalModules: [
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
        customPropertiesProvider,
        CamundaPlatformPropertiesProviderModule
      ],
      moddleExtensions: {
        custom: custom,
        flowable: flowable
      }
    })
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      console.log('Diagram component route params:', params);
      this.processId = params['processId'];
      this.instanceId = params['instanceId'] || params['processInstanceId'];
      console.log('Set processId to:', this.processId);
      console.log('Set instanceId to:', this.instanceId);
      
      // Parse process name from processId if not provided explicitly
      if (params['processName']) {
        this.processName = params['processName'];
        console.log('Using processName from params:', this.processName);
      } else if (this.processId) {
        // Parse process information to generate display name
        console.log('Parsing processId for display name:', this.processId);
        const processInfo = this.formDeploymentService.parseProcessInfo(this.processId);
        this.processName = processInfo.displayName;
        console.log('Parsed process info from processId:', processInfo);
        console.log('Set processName to:', this.processName);
      } else {
        console.log('No processId available, setting processName to null');
        this.processName = null;
      }
      
      // Test the parsing with the new format for demonstration
      if (this.processId === 'orderProcess:2:ad4404c7-8571-11f0-b93b-4a92a0e0ae0f') {
        console.log('🎯 Detected full Flowable format processId - parsing demonstration:');
        const testParse = this.formDeploymentService.parseProcessInfo(this.processId);
        console.log('Parse result:', testParse);
      }
    });
  }

  ngAfterContentInit(): void {
    // attach BpmnJS instance to DOM element
    this.bpmnJS!.attachTo(this.diagramRef!.nativeElement);

    const propertiesPanel = this.bpmnJS.get('propertiesPanel');

    // @ts-ignore
    propertiesPanel.attachTo(this.propertiesRef!.nativeElement);

    // Load diagram from API if processId is provided, otherwise load default
    if (this.processId) {
      this.loadProcessDiagram(this.processId);
    } else {
      this.importDiagram(this.xml);
    }

    // Set up User Task interaction handlers
    this.setupUserTaskHandlers();
  }

  loadProcessDiagram(processId: string): void {
    this.loading = true;
    this.error = null;

    this.processDefinitionService.getProcessDefinitionXml(processId).subscribe({
      next: (xmlData) => {
        this.importDiagram(xmlData).subscribe({
          next: () => {
            this.loading = false;
          },
          error: (err) => {
            this.error = 'Failed to load process diagram';
            this.loading = false;
            console.error('Error importing diagram XML:', err);
          }
        });
      },
      error: (err) => {
        this.error = 'Failed to fetch process diagram from server';
        this.loading = false;
        console.error('Error loading process XML:', err);
        // Fallback to default diagram
        this.importDiagram(this.xml);
      }
    });
  }

  /**
   * Creates a Promise to import the given XML into the current
   * BpmnJS instance, then returns it as an Observable.
   */
  private importDiagram(xml: string): Observable<{ warnings: Array<any> }> {
    return from(this.bpmnJS!.importXML(xml) as Promise<{ warnings: Array<any> }>);
  }

  /**
   * Exports the current BPMN diagram as an XML file and triggers a download of the file.
   * The exported diagram will have a `.xml` file extension and include proper formatting.
   * Shows an error in the console if the `bpmnJS` instance is not initialized.
   *
   * @return {void} No value is returned. The function performs file export and download actions.
   */
  exportDiagram(): void {
    if (!this.bpmnJS) {
      console.error('bpmnJS is not initialized');
      return;
    }

    this.bpmnJS.saveXML({format: true}).then((xml) => {
      // Create a Blob from the XML data
      const blob = new Blob([xml.xml ?? ''], {type: 'text/xml'});
      const url = window.URL.createObjectURL(blob);

      // Create a download link
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagram.xml';
      a.style.display = 'none';

      // Append the link, trigger download, and clean up
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Revoke the object URL after a short delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    }).catch((err) => {
      console.log(err);
    });
  }

  resetDiagram(): void {
    this.importDiagram(this.xml);
  }

  toggleProperties(): void {
    this.propertiesCollapsed = !this.propertiesCollapsed;
  }

  deployDiagram(): void {
    if (!this.bpmnJS) {
      this.snackBar.open('BPMN modeler not initialized', 'Close', { duration: 3000 });
      return;
    }

    // Extract current process name from the diagram if available
    let currentProcessName = this.processName || '';
    
    const dialogData: DeploymentDialogData = {
      currentName: currentProcessName,
      title: 'Deploy Process Definition',
      message: 'Enter a name for this process deployment. This will create or update the process definition on the server.'
    };

    const dialogRef = this.dialog.open(DeploymentDialogComponent, {
      width: '450px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: DeploymentDialogResult) => {
      if (result && result.confirmed) {
        this.performDeployment(result.processName);
      }
    });
  }

  private performDeployment(processName: string): void {
    this.deploying = true;

    this.bpmnJS.saveXML({ format: true }).then((result) => {
      if (result.xml) {
        this.processDefinitionService.deployProcessDefinition(result.xml, processName).subscribe({
          next: (response) => {
            this.deploying = false;
            this.snackBar.open(
              `Process "${processName}" deployed successfully!`, 
              'Close', 
              { 
                duration: 5000,
                panelClass: ['success-snackbar']
              }
            );
            
            // Update the current process name
            this.processName = processName;
            
            console.log('Deployment successful:', response);
          },
          error: (error) => {
            this.deploying = false;
            console.error('Deployment failed:', error);
            
            let errorMessage = 'Failed to deploy process definition';
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
      } else {
        this.deploying = false;
        this.snackBar.open('Failed to export diagram XML', 'Close', { duration: 3000 });
      }
    }).catch((error) => {
      this.deploying = false;
      console.error('Error exporting XML:', error);
      this.snackBar.open('Failed to export diagram', 'Close', { duration: 3000 });
    });
  }

  /**
   * Sets up event handlers for User Task interactions
   */
  private setupUserTaskHandlers(): void {
    if (!this.bpmnJS) return;

    const eventBus = this.bpmnJS.get('eventBus') as any;
    
    // Handle element double-click for form navigation
    eventBus.on('element.dblclick', (event: any) => {
      const element = event.element;
      
      // Check if it's a User Task
      if (element && element.businessObject && element.businessObject.$type === 'bpmn:UserTask') {
        this.handleUserTaskDoubleClick(element);
      }
    });

    // Handle element selection to show form info
    eventBus.on('selection.changed', (event: any) => {
      if (event.newSelection.length === 1) {
        const element = event.newSelection[0];
        
        if (element && element.businessObject && element.businessObject.$type === 'bpmn:UserTask') {
          this.showUserTaskFormInfo(element);
        }
      }
    });
  }

  /**
   * Handles double-click on User Task to navigate to form
   */
  private handleUserTaskDoubleClick(element: any): void {
    const hasForm = this.taskNavigationService.hasFormConfiguration(element);
    
    if (hasForm) {
      // Extract task mapping and navigate to form
      const processInstanceToUse = this.instanceId || this.processId || undefined;
      console.log('Using processInstanceId for form navigation:', {
        instanceId: this.instanceId,
        processId: this.processId,
        chosen: processInstanceToUse
      });
      
      const mapping = this.taskNavigationService.extractTaskFormMapping(element, processInstanceToUse, this.processName || undefined);
      this.taskNavigationService.navigateToTaskForm(mapping);
      
      this.snackBar.open(
        `Opening form for task: ${mapping.taskName}`,
        'Close',
        { duration: 3000 }
      );
    } else {
      // Show message about no form configuration
      this.snackBar.open(
        'No form configured for this User Task. Add a Form Key in the properties panel.',
        'Close',
        { duration: 5000 }
      );
    }
  }

  /**
   * Shows form information for selected User Task
   */
  private showUserTaskFormInfo(element: any): void {
    const formSummary = this.taskNavigationService.getFormSummary(element);
    console.log(`Selected User Task: ${element.businessObject.name || element.businessObject.id}`);
    console.log(`Form Configuration: ${formSummary}`);
    
    if (this.taskNavigationService.hasFormConfiguration(element)) {
      const url = this.taskNavigationService.createTaskFormUrl(
        this.taskNavigationService.extractTaskFormMapping(element, this.instanceId || this.processId || undefined, this.processName || undefined)
      );
      console.log(`Form URL: ${url}`);
    }
  }

  /**
   * Opens form for a specific User Task (can be called programmatically)
   */
  openTaskForm(taskId: string): void {
    if (!this.bpmnJS) {
      this.snackBar.open('BPMN diagram not loaded', 'Close', { duration: 3000 });
      return;
    }

    const elementRegistry = this.bpmnJS.get('elementRegistry') as any;
    const element = elementRegistry.get(taskId);

    if (element && element.businessObject && element.businessObject.$type === 'bpmn:UserTask') {
      this.handleUserTaskDoubleClick(element);
    } else {
      this.snackBar.open(`User Task with ID "${taskId}" not found`, 'Close', { duration: 3000 });
    }
  }

  /**
   * Shows help about how to use task forms
   */
  showTaskFormHelp(): void {
    const helpMessage = `
      Task Form Mapping Guide:
      
      1. Select a User Task element
      2. Configure form properties in Properties Panel → Form Mapping:
         • Form Key: e.g., "orderForm" or "embedded:deployment:forms/approval.json"
         • Form Type: Choose from Embedded, External, Generated, Custom
      
      3. Double-click the User Task to open its form
      
      Tips:
      • User Tasks with forms show details in the console when selected
      • Forms open in a new tab/route: /form?taskId=...
      • Use Form Key for Flowable process engine compatibility
    `;

    console.log('Task Form Mapping Help:', helpMessage);
    
    this.snackBar.open(
      'Task Form help logged to console. Check Properties Panel → Form Mapping for User Tasks.',
      'Close',
      { duration: 8000 }
    );
  }

  ngOnDestroy(): void {
    // destroy BpmnJS instance
    this.bpmnJS!.destroy();
  }
}
