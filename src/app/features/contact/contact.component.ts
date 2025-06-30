import { Component } from '@angular/core';
import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from '../../footer/footer.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactService } from '../../Services/contact.service';
import Swal from 'sweetalert2';
import { Contact } from '../../Models/contact';
import { AuthService } from '../../Services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-contact',
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true,
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  constructor(private fb: FormBuilder, private contactService: ContactService , private authService: AuthService) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });



  }
  contactForm!: FormGroup;
submitForm() {

    if (!this.authService.isLoggedIn()) {
      Swal.fire({
        icon: 'info',
        title: 'Login Required',
        text: 'You must be logged in to send a message.',
        confirmButtonText: 'Go to Login'
      }).then(result => {
        if (result.isConfirmed) {
          window.location.href = '/login';
                            
        }
      });
      return;
    }

    if (this.contactForm.valid) {
      const user = this.authService.currentUserValue;

      const contactData :Contact = {
        name: this.contactForm.value.name,
        email: this.contactForm.value.email,
        subject: this.contactForm.value.subject,
        message: this.contactForm.value.message,
        status: 'New',
        isDeleted: false,
        createdAt: new Date(),
        responsedBy: 0,
        messageId: 0, 
        isFromAdmin: false
      };

      this.contactService.sendContactMessage(contactData).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Message Sent!',
            text: 'Your message has been submitted successfully.',
          });
          this.contactForm.reset();
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Something went wrong! Please try again.',
          });
        }
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Form Incomplete',
        text: 'Please fill in all fields correctly.',
      });
    }
  }
}   


  
   
  

