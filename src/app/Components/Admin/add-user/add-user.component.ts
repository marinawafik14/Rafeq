import { Component, EventEmitter, Output, output } from '@angular/core';
import { Users } from '../../../Models/Users';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-user',
  imports: [FormsModule , CommonModule ],
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.css'
})
export class AddUserComponent {
@Output() save = new EventEmitter<Users>();
@Output() cancel = new EventEmitter<void>();
newUser: Users = {
id: 0,
fullName: '',
email: '',
PasswordHash : '',
role: '',
Bio: '',
profilePicture: '',
isActive: false,
createdAt: new Date(),
isMentor : false,
isInterviewer: false,
IsDeleted: false,
IsEmailVerified: false,
RoleId: 0,
HourlyRate: 0,
ExternalId: '',
ExternalType: '', 

}

onSave() {
  this.save.emit(this.newUser);
}
onCancel() {
  this.cancel.emit();

}
}
