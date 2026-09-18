import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TopbarComponent } from '../../shared/components/topbar/topbar';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
import { ContactService, ContactRequest, ContactRequestMessage } from '../../services/contact.service';
import { AuthService } from '../../services/auth';
import { UserProfileComponent, UserProfileData } from '../contacts/components/user-profile/user-profile';
import { isPresetAvatar, getPresetSvg } from '../../core/constants/avatars';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
    selector: 'app-contact-requests',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TopbarComponent,
        SidebarComponent,
        UserProfileComponent,
        TableModule,
        ButtonModule,
        DialogModule,
        ConfirmDialogModule,
        ToastModule,
        TagModule,
        InputTextModule,
        TextareaModule,
        CheckboxModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './contact-requests.html',
    styleUrls: ['./contact-requests.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactRequestsComponent implements OnInit {
    private contactService = inject(ContactService);
    private authService = inject(AuthService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private router = inject(Router);
    private sanitizer = inject(DomSanitizer);

    // Role & user state
    isAdmin = signal<boolean>(false);
    currentUsername = signal<string>('');

    // Profile & avatar state
    profileData = signal<UserProfileData>({ username: '', email: '', country: '', avatarUrl: '' });
    showProfileDialog = signal<boolean>(false);

    // New contact request dialog state
    showContactDialog = signal<boolean>(false);
    communicationTypes = ['Şikayet', 'Talep', 'Bilgi', 'Teşekkür', 'Öneri'];
    contactForm: ContactRequest = {
        communicationType: 'Talep',
        subject: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        email: '',
        message: '',
        city: '',
        branch: ''
    };

    // Active tab and requests list
    activeTab = signal<'pending' | 'completed'>('pending');
    requests = signal<ContactRequest[]>([]);
    isLoading = signal<boolean>(false);

    // Unviewed requests preview modal
    unviewedRequests = signal<ContactRequest[]>([]);
    showUnviewedDialog = signal<boolean>(false);

    // Chat modal state
    showChatDialog = signal<boolean>(false);
    selectedRequest = signal<ContactRequest | null>(null);
    newMessageText: string = '';
    isSendingMessage = signal<boolean>(false);

    // Computed metrics
    pendingCount = computed(() => this.requests().filter(r => (r.status || 'Pending') === 'Pending').length);
    completedCount = computed(() => this.requests().filter(r => r.status === 'Completed').length);

    filteredRequests = computed(() => {
        const status = this.activeTab() === 'pending' ? 'Pending' : 'Completed';
        return this.requests().filter(r => (r.status || 'Pending') === status);
    });

    ngOnInit(): void {
        this.isAdmin.set(this.authService.isAdmin());
        const username = this.authService.getUsername();
        this.currentUsername.set(username);

        const cachedAvatar = localStorage.getItem(`profile_avatar_${username}`) || '';
        this.profileData.set({
            username: username,
            email: localStorage.getItem(`profile_email_${username}`) || '',
            country: localStorage.getItem(`profile_country_${username}`) || '',
            avatarUrl: cachedAvatar
        });

        this.authService.getAvatar().subscribe({
            next: (res) => {
                if (res?.avatarUrl !== undefined) {
                    const avatar = res.avatarUrl || '';
                    this.profileData.update(p => ({ ...p, avatarUrl: avatar }));
                    if (avatar) {
                        localStorage.setItem(`profile_avatar_${username}`, avatar);
                    } else {
                        localStorage.removeItem(`profile_avatar_${username}`);
                    }
                }
            },
            error: () => { }
        });

        this.loadRequests();
        this.checkUnviewedRequests();
    }

    setActiveTab(tab: 'pending' | 'completed'): void {
        this.activeTab.set(tab);
    }

    loadRequests(): void {
        this.isLoading.set(true);
        const req$ = this.isAdmin()
            ? this.contactService.getContactRequests()
            : this.contactService.getMyContactRequests();

        req$.subscribe({
            next: (data) => {
                this.requests.set(data);
                this.isLoading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Talepler yüklenemedi.' });
                this.isLoading.set(false);
            }
        });
    }

    checkUnviewedRequests(): void {
        this.contactService.getUnviewedRequests().subscribe({
            next: (data) => {
                if (data && data.length > 0) {
                    this.unviewedRequests.set(data);
                    this.showUnviewedDialog.set(true);
                }
            },
            error: () => { }
        });
    }

    closeUnviewedDialog(): void {
        // Açılan talepleri görüntülendi olarak işaretle
        const unviewed = this.unviewedRequests();
        unviewed.forEach(req => {
            if (req.id) {
                this.contactService.markRequestAsViewed(req.id).subscribe();
            }
        });
        this.showUnviewedDialog.set(false);
        this.loadRequests(); // Rozetleri güncelle
    }

    openChat(request: ContactRequest): void {
        if (!request.id) return;

        // Görüntülendi işaretle
        this.contactService.markRequestAsViewed(request.id).subscribe();

        this.contactService.getContactRequestById(request.id).subscribe({
            next: (fullRequest) => {
                this.selectedRequest.set(fullRequest);
                this.showChatDialog.set(true);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Talep detayı alınamadı.' });
            }
        });
    }

    sendMessage(): void {
        const text = this.newMessageText.trim();
        const req = this.selectedRequest();
        if (!text || !req || !req.id || this.isSendingMessage()) return;

        this.isSendingMessage.set(true);
        this.contactService.sendRequestMessage(req.id, text).subscribe({
            next: (newMsg) => {
                const currentMessages = req.messages ? [...req.messages, newMsg] : [newMsg];
                this.selectedRequest.set({ ...req, messages: currentMessages });
                this.newMessageText = '';
                this.isSendingMessage.set(false);
                this.loadRequests(); // Listeyi tazele
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Mesaj gönderilemedi.' });
                this.isSendingMessage.set(false);
            }
        });
    }

    toggleStatus(req: ContactRequest): void {
        if (!req.id || !this.isAdmin()) return;

        const newStatus = req.status === 'Completed' ? 'Pending' : 'Completed';
        this.contactService.updateRequestStatus(req.id, newStatus).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Durum Güncellendi',
                    detail: newStatus === 'Completed' ? 'Talep karşılandı olarak işaretlendi.' : 'Talep beklemeye alındı.'
                });
                if (this.selectedRequest() && this.selectedRequest()?.id === req.id) {
                    this.selectedRequest.set({ ...this.selectedRequest()!, status: newStatus });
                }
                this.loadRequests();
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Durum güncellenemedi.' });
            }
        });
    }

    confirmDelete(event: Event, req: ContactRequest): void {
        event.stopPropagation();
        if (!req.id) return;

        this.confirmationService.confirm({
            message: `#${req.id} numaralı "${req.subject || 'İletişim Talebi'}" kaydını ve mesaj geçmişini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
            header: 'Talebi Sil',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Evet, Sil',
            rejectLabel: 'Vazgeç',
            acceptButtonStyleClass: 'p-button-danger p-button-sm',
            rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
            accept: () => {
                this.deleteRequest(req.id!);
            }
        });
    }

    deleteRequest(id: number): void {
        this.contactService.deleteContactRequest(id).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Başarıyla Silindi',
                    detail: 'İletişim talebi kalıcı olarak silindi.'
                });
                if (this.selectedRequest()?.id === id) {
                    this.showChatDialog.set(false);
                    this.selectedRequest.set(null);
                }
                this.loadRequests();
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Hata',
                    detail: 'Talep silinirken bir hata oluştu veya yetkiniz yok.'
                });
            }
        });
    }

    isMyMessage(m: ContactRequestMessage): boolean {
        if (this.isAdmin()) {
            return m.senderRole === 'Admin';
        }
        return m.senderRole === 'User';
    }

    getBadgeSeverity(type: string): 'info' | 'warn' | 'danger' | 'success' | 'secondary' {
        switch ((type || '').toLowerCase()) {
            case 'şikayet': return 'danger';
            case 'öneri': return 'warn';
            case 'bilgi': return 'info';
            case 'teşekkür': return 'success';
            default: return 'secondary';
        }
    }

    // Topbar navigation and profile handlers
    goToAdmin(): void {
        this.router.navigate(['/admin']);
    }

    goToSettings(): void {
        this.router.navigate(['/settings']);
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    openProfile(): void {
        this.showProfileDialog.set(true);
    }

    saveProfileDetails(data: UserProfileData): void {
        this.profileData.set(data);
        localStorage.setItem(`profile_email_${data.username}`, data.email);
        localStorage.setItem(`profile_country_${data.username}`, data.country);
        if (data.avatarUrl) {
            localStorage.setItem(`profile_avatar_${data.username}`, data.avatarUrl);
        } else {
            localStorage.removeItem(`profile_avatar_${data.username}`);
        }

        this.authService.updateAvatar(data.avatarUrl || null).subscribe({
            next: () => { },
            error: (err) => console.error('Avatar sunucuya kaydedilemedi', err)
        });

        this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'Profil bilgileri güncellendi.' });
        this.showProfileDialog.set(false);
    }

    isPreset(url?: string): boolean {
        return isPresetAvatar(url);
    }

    getPresetSvg(url?: string): SafeHtml {
        const svg = getPresetSvg(url);
        return this.sanitizer.bypassSecurityTrustHtml(svg);
    }

    submitContactForm(): void {
        if (!this.contactForm.firstName || !this.contactForm.phoneNumber || !this.contactForm.message) {
            this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Lütfen zorunlu alanları (Ad, Telefon, Mesaj) doldurunuz.', life: 3000 });
            return;
        }

        if (this.contactForm.email) {
            this.contactForm.email = this.contactForm.email.trim().toLowerCase()
                .replace(/ı/g, 'i')
                .replace(/ğ/g, 'g')
                .replace(/ü/g, 'u')
                .replace(/ş/g, 's')
                .replace(/ö/g, 'o')
                .replace(/ç/g, 'c')
                .replace('xn--gmal-75a', 'gmail.com')
                .replace('xn--gmai-nza', 'gmail.com')
                .replace('gmaıl', 'gmail')
                .replace('hotmaıl', 'hotmail');
        }

        this.contactService.createContactRequest(this.contactForm).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'İletişim talebiniz başarıyla iletildi.', life: 3000 });
                this.showContactDialog.set(false);
                this.contactForm = {
                    communicationType: 'Talep',
                    subject: '',
                    firstName: '',
                    lastName: '',
                    phoneNumber: '',
                    email: '',
                    message: '',
                    city: '',
                    branch: ''
                };
                this.loadRequests();
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Talep iletilirken bir hata oluştu.', life: 3000 });
            }
        });
    }

    lettersOnly(event: KeyboardEvent): boolean {
        const charCode = event.which ? event.which : event.keyCode;
        if (charCode >= 48 && charCode <= 57) {
            event.preventDefault();
            return false;
        }
        return true;
    }

    numbersOnly(event: KeyboardEvent): boolean {
        const charCode = event.which ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            event.preventDefault();
            return false;
        }
        return true;
    }
}
