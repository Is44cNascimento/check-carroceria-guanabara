import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

type ChecklistItem = { key: string; label: string };
type ChecklistValue = boolean | null;

@Component({
  selector: 'app-formulario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './formulario.html',
  styleUrls: ['./formulario.css']
})
export class Formulario {
  form: FormGroup;
  submitted = false;
  loading = false;

  // URL do endpoint Spring Boot
  private readonly apiUrl = 'http://localhost:8080/api/checklist';

  items: ChecklistItem[] = [
    { key: 'faroisBaixos', label: 'Faróis baixos' },
    { key: 'faroisAltos', label: 'Faróis altos' },
    { key: 'setasDianteiras', label: 'Setas dianteiras' },
    { key: 'setasTraseiras', label: 'Setas traseiras' },
    { key: 'piscaAlerta', label: 'Pisca-alerta' },
    { key: 'lanternasDianteiras', label: 'Lanternas dianteiras' },
    { key: 'lanternasTraseiras', label: 'Lanternas traseiras' },
    { key: 'luzesFreio', label: 'Luzes de freio' },
    { key: 'luzRe', label: 'Luzes de ré' },
    { key: 'luzPlaca', label: 'Luz da placa' },
    { key: 'faroisNeblina', label: 'Faróis de neblina, quando aplicável' },
    { key: 'limpadoresParabrisa', label: 'Limpadores de para-brisa' },
    { key: 'palhetasParabrisa', label: 'Palhetas do para-brisa' },
    { key: 'esguichosParabrisa', label: 'Esguichos do para-brisa' },
    { key: 'reservatorioLimpador', label: 'Reservatório de água do limpador' },
    { key: 'parabrisaTrincas', label: 'Para-brisa sem trincas ou danos' },
    { key: 'espelhosRetrovisores', label: 'Espelhos retrovisores' },
    { key: 'carroceriaDanos', label: 'Carroceria sem danos aparentes' }
  ];

  constructor(private fb: FormBuilder, private http: HttpClient) {
    const controls: Record<string, ChecklistValue> = {};
    this.items.forEach(item => (controls[item.key] = null));
    this.form = this.fb.group(controls);
  }

  isChecked(key: string, option: boolean): boolean {
    return this.form.get(key)?.value === option;
  }

  // Só 1 opção por linha e pode desmarcar clicando de novo
  onToggle(key: string, option: boolean): void {
    const current = this.form.get(key)?.value as ChecklistValue;
    this.form.get(key)?.setValue(current === option ? null : option);
  }

  private allAnswered(): boolean {
    return this.items.every(item => this.form.get(item.key)?.value !== null);
  }

  onSubmit(event?: Event): void {
  // impede comportamento padrão do navegador (recarregar)
  event?.preventDefault();

  this.submitted = true;

  if (!this.allAnswered()) {
    alert('Preencha todos os itens com V ou F antes de enviar.');
    return; // mantém tela como está
  }

  const payload = this.form.value as Record<string, boolean>;
  this.loading = true;

  this.http.post(this.apiUrl, payload).subscribe({
    next: () => {
      this.loading = false;
      alert('Checklist enviado com sucesso!');
      // não recarrega e não limpa, mantém como está
    },
    error: (err) => {
      this.loading = false;
      console.error(err);
      alert('Erro ao enviar para o backend Spring.');
      // mantém exatamente o estado atual
    }
  });
}
}