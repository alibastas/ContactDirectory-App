import { Component, ChangeDetectionStrategy, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './sidebar.html',
    styleUrls: ['./sidebar.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
    // Tracks sidebar collapsed state
    isCollapsed = signal<boolean>(false);

    // Emits collapse state changes to parent components
    @Output() collapsedChange = new EventEmitter<boolean>();

    toggleCollapse(): void {
        const newState = !this.isCollapsed();
        this.isCollapsed.set(newState);
        this.collapsedChange.emit(newState);
    }
}
