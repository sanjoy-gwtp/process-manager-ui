import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProcessDefinition } from '../models/process-definition.model';
import { ProcessDefinitionService } from '../services/process-definition.service';

@Component({
  selector: 'app-process-list',
  templateUrl: './process-list.component.html',
  styleUrls: ['./process-list.component.css'],
  standalone: false
})
export class ProcessListComponent implements OnInit {
  processDefinitions: ProcessDefinition[] = [];
  loading = false;
  error: string | null = null;
  displayedColumns: string[] = ['name', 'key', 'version', 'category', 'resource', 'status', 'hasForm', 'hasDiagram', 'actions'];

  constructor(
    private processDefinitionService: ProcessDefinitionService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadProcessDefinitions();
  }

  loadProcessDefinitions(): void {
    this.loading = true;
    this.error = null;
    
    this.processDefinitionService.getProcessDefinitions().subscribe({
      next: (data) => {
        this.processDefinitions = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load process definitions';
        this.loading = false;
        console.error('Error loading process definitions:', err);
      }
    });
  }

  refresh(): void {
    this.loadProcessDefinitions();
  }

  viewDetails(process: ProcessDefinition): void {
    this.router.navigate(['/processes', process.id]);
  }

  viewDiagram(process: ProcessDefinition): void {
    this.router.navigate(['/diagram'], { 
      queryParams: { processId: process.id } 
    });
  }

  startProcess(process: ProcessDefinition): void {
    console.log('Starting process:', process.key);
    // TODO: Implement start process functionality
  }
}