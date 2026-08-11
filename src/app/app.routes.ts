import { Routes } from '@angular/router';
import { Formulario } from './formulario/formulario';

export const routes: Routes = [
  {path: '', redirectTo: 'formulario', pathMatch: 'full'},
  {path: 'formulario', component: Formulario},

];
