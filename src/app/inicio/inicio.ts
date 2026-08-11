import { Component } from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';
import {Formulario} from '../formulario/formulario';

@Component({
  selector: 'app-inicio',
  imports: [RouterOutlet,RouterLink],
  styleUrl: './inicio.css',
  templateUrl: './inicio.html',
})
export class Inicio {
  protected readonly Formulario = Formulario;
}
