import { Component, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent {
  @ViewChild('drawer') drawer!: MatSidenav;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(private breakpointObserver: BreakpointObserver, private router: Router) {
    // Subscribe to router events to close drawer on navigation
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Close the drawer when navigation completes
        if (this.drawer && this.drawer.opened) {
          this.drawer.close();
        }
      }
    });
  }

  toggleDrawer() {
    this.drawer.toggle();
  }

  closeDrawer() {
    if (this.drawer) {
      this.drawer.close();
    }
  }
}
