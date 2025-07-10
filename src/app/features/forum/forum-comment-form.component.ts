import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForumService } from '../../Services/forum.service';
import { ForumComment } from '../../Models/Forum/forum-comment.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forum-comment-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forum-comment-form.component.html',
  styleUrl: './forum-comment-form.component.css'
})
export class ForumCommentFormComponent implements OnChanges {
  @Input() postId!: number;
  @Input() editingComment: ForumComment | null = null;
  @Output() commentAdded = new EventEmitter<void>();

  content: string = '';
  isLoading = false;
  error: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingComment'] && this.editingComment) {
      this.content = this.editingComment.content;
    } else if (changes['editingComment'] && !this.editingComment) {
      this.content = '';
    }
  }

  constructor(private forumService: ForumService) {}

  submit() {
    this.error = null;
    if (!this.content.trim()) {
      this.error = 'Comment cannot be empty.';
      return;
    }
    this.isLoading = true;
    if (this.editingComment) {
      this.forumService.updateComment(this.editingComment.commentId, this.content).subscribe({
        next: () => {
          this.isLoading = false;
          this.content = '';
          Swal.fire({
            icon: 'success',
            title: 'Comment updated!',
            timer: 1500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
          this.commentAdded.emit();
        },
        error: (err) => {
          this.error = err.message || 'Failed to update comment';
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Failed to update comment',
            text: this.error || undefined, 
            confirmButtonColor: '#dc3545'
          });
        }
      });
    } else {
      this.forumService.addComment(this.postId, { content: this.content }).subscribe({
        next: () => {
          this.isLoading = false;
          this.content = '';
          Swal.fire({
            icon: 'success',
            title: 'Comment added!',
            timer: 1500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
          this.commentAdded.emit();
        },
        error: (err) => {
          this.error = err.message || 'Failed to add comment';
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Failed to add comment',
            text: this.error || undefined, 
            confirmButtonColor: '#dc3545'
          });
        }
      });
    }
  }

  cancelEdit() {
    this.content = '';
    this.commentAdded.emit();
    Swal.fire({
      icon: 'info',
      title: 'Edit cancelled',
      timer: 1000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  }
}
