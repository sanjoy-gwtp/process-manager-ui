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

const custom = require('../custom-properties-provider/descriptors/custom.json');

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
   propertiesCollapsed = false;
   deploying = false;

  // retrieve DOM element reference
  @ViewChild('diagramRef', {static: true}) diagramRef: ElementRef | undefined;
  @ViewChild('propertiesRef', {static: true}) propertiesRef: ElementRef | undefined;

  private xml: string = `<?xml version="1.0" encoding="UTF-8"?>
  <bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn">
    <bpmn2:process id="Process_1" isExecutable="false">
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
    private snackBar: MatSnackBar
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
        custom: custom
      }
    })
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.processId = params['processId'];
      this.processName = params['processName'] || null;
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

  ngOnDestroy(): void {
    // destroy BpmnJS instance
    this.bpmnJS!.destroy();
  }
}
