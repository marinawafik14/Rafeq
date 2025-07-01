import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Contact } from '../../../Models/contact';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-replay-form',
  imports: [FormsModule , CommonModule],
  templateUrl: './replay-form.component.html',
  styleUrl: './replay-form.component.css',
  standalone : true,
})
export class ReplayFormComponent {
@Input() selectedMessage!: Contact;
  @Output() onCancel = new EventEmitter<void>();
  @Output() onSendReply = new EventEmitter<string>();

  replyText: string = '';

  send() {
    this.onSendReply.emit(this.replyText);
    this.replyText = '';
  }

  cancel() {
    this.onCancel.emit();
  }
}
