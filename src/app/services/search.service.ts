import { Injectable } from '@angular/core';
import { User } from '../models/user.class';
import { Channel } from '../models/channel.class';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { Message } from '../models/message.class';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})

export class SearchService {

    private filteredUsersSubject = new BehaviorSubject<User[]>([]);
    private filteredChannelsSubject = new BehaviorSubject<Channel[]>([]);
    private filteredMessagesSubject = new BehaviorSubject<Message[]>([]);
    private showAutocompleteSubject = new BehaviorSubject<boolean>(false);
    private searchTermSubject = new BehaviorSubject<string>('');

    filteredUsers$ = this.filteredUsersSubject.asObservable();
    filteredChannels$ = this.filteredChannelsSubject.asObservable();
    filteredMessages$ = this.filteredMessagesSubject.asObservable();
    showAutocomplete$ = this.showAutocompleteSubject.asObservable();
    searchTerm$ = this.searchTermSubject.asObservable();

    filteredData$: Observable<{
        users: User[],
        channels: Channel[],
        messages: Message[],
        showAutocomplete: boolean
    }> = combineLatest([
        this.filteredUsers$,
        this.filteredChannels$,
        this.filteredMessages$,
        this.showAutocomplete$
    ]).pipe(
        map(([users, channels, messages, showAutocomplete]) => ({
            users,
            channels,
            messages,
            showAutocomplete
        }))
    );

    showAutocompleteList() {
        this.showAutocompleteSubject.next(true);
    }

    hideAutocompleteList() {
        this.showAutocompleteSubject.next(false);
    }


    filterByType(searchTerm: string, users: User[], channels: Channel[], messages: Message[], currentUserId:string) {
        const query = searchTerm.toLowerCase();
        if (searchTerm.startsWith('@')) {
            const filteredUsers = users.filter(user =>
                user.name.toLowerCase().includes(query.slice(1))
            );
            this.filteredUsersSubject.next(filteredUsers);
        } else if (searchTerm.startsWith('#')) {
            const filteredChannels = channels.filter(channel => {
                const isCreator = channel.members.some(member => member.userId === currentUserId && member.name === channel.creatorName);
                const isMember = channel.members.some(member => member.userId === currentUserId);
                return (isCreator || isMember) && channel.channelName.toLowerCase().includes(query.slice(1));
            });
            this.filteredChannelsSubject.next(filteredChannels);
        } else {

            const filteredEmails = users.filter(user =>
                user.mail.toLowerCase().includes(query)
            );
            this.filteredUsersSubject.next(filteredEmails);

            const filteredMessages = messages.filter(message =>
                message.text.toLowerCase().includes(query)
            );
            this.filteredMessagesSubject.next(filteredMessages);
        }
        this.showAutocompleteList()
    }


    updateSearchTerm(term: string) {
        this.searchTermSubject.next(term);
        if (term.length < 3) {
            this.hideAutocompleteList();
            this.clearFilters();
        } else {
            this.showAutocompleteList();
        }
    }

    clearFilters() {
        this.filteredUsersSubject.next([]);
        this.filteredChannelsSubject.next([]);
        this.filteredMessagesSubject.next([]);
        this.hideAutocompleteList();
    }
}
