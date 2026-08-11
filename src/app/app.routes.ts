import { Routes } from '@angular/router';
import { Formulario } from './formulario/formulario';
import { Inicio } from './inicio/inicio';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: Inicio },
  { path: 'formulario', component: Formulario }
];
