import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProcessListComponent } from './process-list/process-list.component';
import { ProcessDetailComponent } from './process-detail/process-detail.component';
import { DiagramComponent } from './diagram/diagram.component';

const routes: Routes = [
  { path: '', redirectTo: '/processes', pathMatch: 'full' },
  { path: 'processes', component: ProcessListComponent },
  { path: 'processes/:id', component: ProcessDetailComponent },
  { path: 'diagram', component: DiagramComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
