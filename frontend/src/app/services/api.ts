import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { BehaviorSubject, Observable, of, tap } from "rxjs";

export interface User {
  discordId: string;
  username: string;
  discriminator: string;
  email?: string;
  avatar?: string;
  main?: string;
}

@Injectable({
  providedIn: "root",
})
export class Api {
  private apiUrl = "http://localhost:3000";
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = localStorage.getItem("jwt");
    if (token) this.fetchUserProfile().subscribe();
  }

  // AUTH

  private getAuthHeaders(): HttpHeaders | null {
    const token = localStorage.getItem("jwt");
    if (!token) return null;
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  fetchUserProfile(): Observable<User | null> {
    const headers = this.getAuthHeaders();
    if (!headers) return of(null);

    return this.http.get<User>(`${this.apiUrl}/auth/profile`, { headers }).pipe(
      tap({
        next: (user) => this.userSubject.next(user),
        error: () => this.userSubject.next(null),
      }),
    );
  }

  setToken(token: string) {
    localStorage.setItem("jwt", token);
    this.fetchUserProfile().subscribe();
  }

  clearUser() {
    localStorage.removeItem("jwt");
    this.userSubject.next(null);
  }

  getUser(): User | null {
    return this.userSubject.value;
  }

  setUser(user: User | null) {
    this.userSubject.next(user);
  }

  // USER MANAGEMENT

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/api/users`);
  }

  getUserByDiscordId(discordId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/api/users/${discordId}`);
  }

  updateUser(discordId: string, data: Partial<User>): Observable<User> {
    return this.http
      .put<User>(`${this.apiUrl}/api/users/${discordId}`, data)
      .pipe(
        tap((user) => {
          if (this.userSubject.value?.discordId === user.discordId)
            this.setUser(user);
        }),
      );
  }

  setMain(main: string): Observable<User | null> {
    const token = localStorage.getItem("jwt");
    console.log("JWT:", token, "Main:", main);

    if (!token) return of(null);

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http
      .post<User>(`${this.apiUrl}/users/set-main`, { main }, { headers })
      .pipe(tap((user) => this.setUser(user)));
  }
}
