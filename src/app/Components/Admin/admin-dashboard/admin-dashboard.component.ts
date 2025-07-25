import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterOutlet, RouterLink, CommonModule],
  standalone: true,
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent  implements AfterViewInit{

  ngAfterViewInit(): void {
   const arrows = document.querySelectorAll(".arrow");
      arrows.forEach(arrow=> {
        arrow.addEventListener('click', e=>{
          const arrowParent = (e.target as HTMLElement).parentElement ?.parentElement;
          arrowParent?.classList.toggle("showMenu")
        });
      });
       const sidebar = document.querySelector('.sidebar');
    const sidebarBtn = document.querySelector('.bx-menu');

    sidebarBtn?.addEventListener('click', () => {
      sidebar?.classList.toggle('close');
    });
  }
  logout() {
  
  localStorage.clear();
  sessionStorage.clear();

  window.location.href = '/login';
 
}
}
