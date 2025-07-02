import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactService } from '../../../Services/contact.service';
import { Contact, Replies } from '../../../Models/contact';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-contact',
  templateUrl: './admin-contact.component.html',
  styleUrls: ['./admin-contact.component.css'],
  imports: [CommonModule , FormsModule, ReactiveFormsModule],
  standalone: true
})
export class AdminContactComponent implements OnInit {
  messages: Contact[] = [];
  filteredMessages: Contact[] = [];
  selectedMessage: Contact | null = null;
  replyForm!: FormGroup;
  searchText: string = '';

  chatItems: {
    sender: 'mentee' | 'admin',
    text: string,
    createdAt: Date,
    read: boolean
  }[] = [];

  constructor(private contactService: ContactService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.replyForm = this.fb.group({
      replyText: ['', Validators.required]
    });

    this.loadMessages();

    
    setInterval(() => {
      this.loadMessages();
      if (this.selectedMessage) {
      this.selectMessage(this.selectedMessage);
    }
    }, 10000);
  }

  loadMessages() {
  this.contactService.getAllMessages().subscribe(res => {
    const grouped = new Map<string, Contact>();

    res.forEach((msg: Contact) => {
      const email = msg.email?.toLowerCase();

      if (!email) return;

      const adjustedDate = new Date(msg.createdAt);
      adjustedDate.setHours(adjustedDate.getHours() + 3);
      msg.createdAt = adjustedDate;

      if (!grouped.has(email)) {
        grouped.set(email, msg);
      } else {
        const existing = grouped.get(email)!;
        const existingTime = new Date(existing.createdAt).getTime();
        const newTime = adjustedDate.getTime();

        if (!isNaN(newTime) && newTime > existingTime) {
          grouped.set(email, msg);
        }
      }
    });

    this.messages = Array.from(grouped.values());
    this.applySearch();
  });
}


  applySearch() {
    if (!this.searchText.trim()) {
      this.filteredMessages = this.messages;
    } else {
      const search = this.searchText.toLowerCase();
      this.filteredMessages = this.messages.filter(msg =>
        (msg.name || msg.email).toLowerCase().includes(search)
      );
    }
  }



selectMessage(message: Contact) {
  this.selectedMessage = message;

  this.contactService.getConversationByEmail(message.email).subscribe(res => {
    const combined = [...res.data.messages, ...res.data.replies];

    this.chatItems = combined.map((item: any) => {
      let createdAt = new Date(item.createdAt);
      createdAt.setHours(createdAt.getHours() + 3);

      if ('message' in item) {
        return {
          read: item.read ?? false,
          sender: 'mentee' as 'mentee',
          text: item.message as string,
          createdAt
        };
      } else {
        return {
          read: item.read ?? false,
          sender: 'admin' as 'admin',
          text: item.replyText as string,
          createdAt
        };
      }
    }).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  });
}


  sendReply() {
    if (this.replyForm.invalid || !this.selectedMessage) return;

    const replyData = {
      messageId: this.selectedMessage.messageId,
      replyText: this.replyForm.value.replyText
    };

    this.contactService.replyToMessage(replyData).subscribe({
      next: (res: Replies) => {
        this.chatItems.push({
          sender: 'admin',
          text: res.replyText,
          createdAt: new Date(res.createdAt),
          read: false
        });
        this.replyForm.reset();
        Swal.fire('Sent!', 'Reply has been sent.', 'success');
        this.loadMessages();
      },
      error: () => {
        Swal.fire('Error!', 'Could not send the reply.', 'error');
      }
    });
  }

  getReadMessages(): number {
    return this.messages.filter(msg => msg.status === 'Read').length;
  }

  getUnreadMessages(): number {
    return this.messages.filter(msg => msg.status !== 'Read').length;
  }

  getTodayMessages(): number {
    const today = new Date();
    return this.messages.filter(msg => {
      if (!msg.createdAt) return false;
      const msgDate = new Date(msg.createdAt);
      return msgDate.toDateString() === today.toDateString();
    }).length;
  }

  refreshMessages(): void {
    this.loadMessages();
  }

  markAsRead(messageId: number): void {
    this.contactService.markAsRead(messageId).subscribe({
      next: () => {
        this.loadMessages();
        if (this.selectedMessage) {
          this.selectedMessage.status = 'Read';
        }
      },
      error: (err) => {
        console.error('Error marking as read:', err);
      }
    });
  }
}
