import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProcessListComponent } from './process-list/process-list.component';
import { ProcessDetailComponent } from './process-detail/process-detail.component';
import { DiagramComponent } from './diagram/diagram.component';
import { FormComponent } from './form/form.component';
import { ProcessInstanceListComponent } from './process-instance-list/process-instance-list.component';
import { ProcessInstanceDetailComponent } from './process-instance-detail/process-instance-detail.component';
import { TaskListComponent } from './task-list/task-list.component';
import { TaskDetailComponent } from './task-detail/task-detail.component';
import { FormListComponent } from './form-list/form-list.component';

const routes: Routes = [
  { path: '', redirectTo: '/processes', pathMatch: 'full' },
  { path: 'processes', component: ProcessListComponent },
  { path: 'processes/:id', component: ProcessDetailComponent },
  { path: 'instances', component: ProcessInstanceListComponent },
  { path: 'instances/:id', component: ProcessInstanceDetailComponent },
  { path: 'tasks', component: TaskListComponent },
  { path: 'tasks/:id', component: TaskDetailComponent },
  { path: 'forms', component: FormListComponent },
  { path: 'diagram', component: DiagramComponent },
  { path: 'form', component: FormComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
