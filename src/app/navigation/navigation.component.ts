import { Component } from '@angular/core';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css'],
  standalone: false
})
export class NavigationComponent {
  navItems: NavItem[] = [
    { label: 'Process Definitions', icon: 'list', route: '/processes' },
    { label: 'Process Instances', icon: 'play_circle', route: '/instances' },
    { label: 'Tasks', icon: 'assignment', route: '/tasks' },
    { label: 'Forms', icon: 'dynamic_form', route: '/forms' },
    { label: 'BPMN Diagram', icon: 'account_tree', route: '/diagram' }
  ];
}
