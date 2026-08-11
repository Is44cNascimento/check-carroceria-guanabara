import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { ChecklistSessionStore } from '../checklist-session.store';

@Component({
  selector: 'app-inicio',
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  styleUrl: './inicio.css',
  templateUrl: './inicio.html'
})
export class Inicio {
  loading = false;

  readonly form = this.fb.group({
    operatorName: ['', [Validators.required]],
    carPrefix: ['', [Validators.required]]
  });

  private readonly apiUrl = '/api/checklist/start';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private sessionStore: ChecklistSessionStore
  ) {}

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const operatorName = this.form.value.operatorName?.trim() ?? '';
    const carPrefix = this.form.value.carPrefix?.trim() ?? '';

    this.loading = true;

    this.http
      .post<{ sessionId: number }>(this.apiUrl, { operatorName, carPrefix })
      .subscribe({
        next: ({ sessionId }) => {
          this.sessionStore.setSession({ sessionId, operatorName, carPrefix });
          this.loading = false;
          this.router.navigate(['/formulario']);
        },
        error: (err) => {
          this.loading = false;
          console.error(err);
          alert('Erro ao iniciar checklist. Tente novamente.');
        }
      });
  }
}
