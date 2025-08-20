import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DiagramComponent } from './diagram/diagram.component';
import { ProcessListComponent } from './process-list/process-list.component';
import { ProcessDetailComponent } from './process-detail/process-detail.component';
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

@NgModule({ declarations: [
        AppComponent,
        DiagramComponent,
        ProcessListComponent,
        ProcessDetailComponent
    ],
    bootstrap: [AppComponent], 
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatCardModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatMenuModule,
        MatTooltipModule
    ], 
    providers: [provideHttpClient(withInterceptorsFromDi())] 
})
export class AppModule { }
