import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DiagramComponent } from './diagram/diagram.component';
import { ProcessListComponent } from './process-list/process-list.component';
import { ProcessDetailComponent } from './process-detail/process-detail.component';
import { ProcessInstanceListComponent } from './process-instance-list/process-instance-list.component';
import { ProcessInstanceDetailComponent } from './process-instance-detail/process-instance-detail.component';
import { TaskListComponent } from './task-list/task-list.component';
import { TaskDetailComponent } from './task-detail/task-detail.component';
import { DeploymentDialogComponent } from './deployment-dialog/deployment-dialog.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

// Material Design Modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

@NgModule({ declarations: [
        AppComponent,
        DiagramComponent,
        ProcessListComponent,
        ProcessDetailComponent,
        ProcessInstanceListComponent,
        ProcessInstanceDetailComponent,
        TaskListComponent,
        TaskDetailComponent,
        DeploymentDialogComponent
    ],
    bootstrap: [AppComponent], 
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        FormsModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatCardModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatMenuModule,
        MatTooltipModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSnackBarModule
    ], 
    providers: [provideHttpClient(withInterceptorsFromDi())] 
})
export class AppModule { }
