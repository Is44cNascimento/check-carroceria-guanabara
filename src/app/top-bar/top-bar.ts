import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-top-bar',
  imports: [RouterOutlet],
  templateUrl: './topBar.html',
  styleUrl: './top-bar.css',
})
export class TopBar {}
