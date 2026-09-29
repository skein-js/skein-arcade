import { Component } from '@angular/core';

@Component({
  selector: 'app-arcade-container',
  standalone: true,
  host: { class: 'contents' },
  template: '<ng-content />',
})
export class ArcadeContainerComponent {}
