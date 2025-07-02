import { Contact, Replies } from './../Models/contact';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
baseURL ="https://localhost:7001/api"
getAllMessUrl = "https://localhost:7001/api/admin/contact"
  constructor(private http : HttpClient) { }
  // sent contact messagepost message
sendContactMessage(data : Contact){
  return this.http.post<Contact>(`${this.baseURL}/Contact` , data)
}
// get all messages

getAllMessages(): Observable<Contact[]> {
  return this.http.get<{ success: boolean, data: Contact[] }>(this.getAllMessUrl).pipe(
    map(res => res.data) 
  );
}


//delete message
deleteMessage(id:number):Observable<void>{
return this.http.delete<void>(`${this.getAllMessUrl}/${id}`)
}



  getRespondedMessages(email: string): Observable<{ data: Contact[] }> {
    return this.http.get<{ data: Contact[] }>(`${this.baseURL}/contact/responded?email=${email}`);
  }


getRepliesByMessageId(messageId: number): Observable<{ success: boolean, data: Replies[] }> {
  return this.http.get<{ success: boolean, data: Replies[] }>(`${this.baseURL}/admin/contact/${messageId}/replies`);
}



replyToMessage(data: { messageId: number; replyText: string }) {
  return this.http.post<Replies>(`${this.baseURL}/admin/contact/reply`, data);
}

getConversationByEmail(email: string): Observable<any> {
  return this.http.get<any>(`${this.baseURL}/contact/conversation?email=${email}`);
}

markAsRead(messageId: number) {
  return this.http.patch(`${this.baseURL}/contact/${messageId}/status?status=Read`, {});
}




}






