import { TranslatePipe } from '@invento/core';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { DriftWallComponent } from '../../shared/ui/drift-wall/drift-wall.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [TranslatePipe, RouterOutlet, DriftWallComponent],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css',
})
export class AuthLayout {}
