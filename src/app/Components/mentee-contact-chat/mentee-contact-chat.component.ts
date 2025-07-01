import { Component, OnInit, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { ContactService } from '../../Services/contact.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-mentee-contact-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './mentee-contact-chat.component.html',
  styleUrl: './mentee-contact-chat.component.css',
  standalone: true
})
export class MenteeContactChatComponent implements OnInit, AfterViewChecked {
  email: string = '';
  name: string = '';
  newMessage: string = '';
  private lastAdminMessageTime: number = 0; 

  chatItems: {
    sender: 'mentee' | 'admin',
    text: string,
    createdAt: Date
  }[] = [];

  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('chatBox') chatBox!: ElementRef<HTMLDivElement>;

  constructor(private contactService: ContactService) {}

  ngOnInit(): void {
    const userData = localStorage.getItem('currentUser');

    if (userData) {
      const parsedUser = JSON.parse(userData);
      this.email = parsedUser.email;
      this.name = parsedUser.fullName || parsedUser.name || '';

      if (this.email) {
        this.pollMessages(); 
        setInterval(() => this.pollMessages(), 10000);  
      }
    }
  }

  pollMessages(): void {
    this.contactService.getConversationByEmail(this.email).subscribe({
      next: res => {
        const combined: {
          sender: 'mentee' | 'admin',
          text: string,
          createdAt: Date
        }[] = [];

        res.data.messages.forEach((msg: any) => {
          combined.push({
            sender: 'mentee',
            text: msg.message,
            createdAt: this.adjustToEgyptTime(msg.createdAt)
          });
        });

        res.data.replies.forEach((reply: any) => {
          const replyTime = this.adjustToEgyptTime(reply.createdAt);
          combined.push({
            sender: 'admin',
            text: reply.replyText,
            createdAt: replyTime
          });

          if (replyTime.getTime() > this.lastAdminMessageTime) {
            this.playNotificationSound();
            this.showToast('📩 You Have A New Message From Admin');
            this.lastAdminMessageTime = replyTime.getTime(); 
          }
        });

        this.chatItems = combined.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      },
      error: err => {
        console.error('Failed to refresh messages:', err);
      }
    });
  }

  playNotificationSound(): void {
    const audio = new Audio('/images/notifications.mp3');
    audio.play().catch(err => {
      console.warn('Autoplay blocked:', err);
    });
  }

  showToast(message: string): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: message,
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true,
      background: '#fffff',
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.chatBox.nativeElement.scrollTop = this.chatBox.nativeElement.scrollHeight;
    } catch (err) {}
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    const messageData = {
      name: this.name,
      email: this.email,
      subject: 'New Message',
      message: this.newMessage,
      status: 'New',
      isDeleted: false,
      createdAt: new Date(),
      responsedBy: 0,
      isFromAdmin: false,
      messageId: 0
    };

    this.contactService.sendContactMessage(messageData).subscribe({
      next: () => {
        this.chatItems.push({
          sender: 'mentee',
          text: this.newMessage,
          createdAt: new Date()
        });
        this.newMessage = '';

        if (this.messageInput && this.messageInput.nativeElement) {
          this.messageInput.nativeElement.style.height = 'auto';
        }
      },
      error: (err) => {
        console.error('Failed to send message:', err);
        alert('Failed to send message. Please try again.');
      }
    });
  }

  autoGrowTextarea(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  adjustToEgyptTime(dateStr: any): Date {
    if (!dateStr) return new Date();

    const utcDate = new Date(dateStr);
    if (isNaN(utcDate.getTime())) return new Date();

    utcDate.setHours(utcDate.getHours() + 3);
    return utcDate;
  }
}
