import { Subject } from 'rxjs';
export class Contact {
    messageId!: number
    name!: string
    email!: string
    subject!: string
    message!: string
    status!: string
    isDeleted!: boolean
    createdAt!: Date
    responsedBy!: number    // admin id
    isFromAdmin!: boolean
    replies?: Replies[];


}

export class Replies {
    replyId !: number
    messageId !: number
    responderId !: number
    replyText !: string
    createdAt !: Date
    responderName!: string
    replies?: Replies[];

}
