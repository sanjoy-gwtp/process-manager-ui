import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private processDefinitionService: ProcessDefinitionService
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
        queryParams: { processId: this.processDefinition.id } 
      });
    }
  }
}