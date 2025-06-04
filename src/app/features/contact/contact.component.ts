import { Component } from '@angular/core';
import { HeaderComponent } from '../../header/header.component'; 
import { FooterComponent } from '../../footer/footer.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact',
  imports: [HeaderComponent, FooterComponent, CommonModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {

}
