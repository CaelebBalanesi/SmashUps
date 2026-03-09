import { Injectable, OnDestroy } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { BehaviorSubject, Observable, of, tap } from "rxjs";
import { io, Socket } from "socket.io-client";
import { environment } from "../../environments/environment";

export interface User {
  discordId: string;
  username: string;
  discriminator: string;
  email?: string;
  avatar?: string;
  main?: string;
}

export interface MatchOpponent {
  id: string;
  username: string;
  avatar?: string;
  main: string;
}

export interface MatchHistoryEntry {
  id: number;
  playerDiscordId: string;
  opponentDiscordId: string;
  opponentUsername: string;
  opponentAvatar?: string;
  opponentMain: string;
  playerMain: string;
  matchedAt: number;
}

export interface PendingMatch {
  matchId: string;
  opponent: MatchOpponent;
  timeoutMs: number;
}

@Injectable({
  providedIn: "root",
})
export class Api implements OnDestroy {
  private apiUrl = environment.apiUrl;
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  // --- WebSocket ---
  private socket: Socket | null = null;
  private matchSubject = new BehaviorSubject<MatchOpponent | null>(null);
  private pendingMatchSubject = new BehaviorSubject<PendingMatch | null>(null);
  private searchingSubject = new BehaviorSubject<boolean>(false);
  private searchMessageSubject = new BehaviorSubject<string>("");

  match$ = this.matchSubject.asObservable();
  pendingMatch$ = this.pendingMatchSubject.asObservable();
  searching$ = this.searchingSubject.asObservable();
  searchMessage$ = this.searchMessageSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = localStorage.getItem("jwt");
    if (token) this.fetchUserProfile().subscribe();
    this.initializeSocket();
  }

  ngOnDestroy() {
    this.socket?.disconnect();
  }

  // ===== AUTH =====

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
    this.initializeSocket(); // reconnect with new token
  }

  clearUser() {
    localStorage.removeItem("jwt");
    this.userSubject.next(null);
    this.socket?.disconnect();
  }

  getUser(): User | null {
    return this.userSubject.value;
  }

  setUser(user: User | null) {
    this.userSubject.next(user);
  }

  // ===== USER MANAGEMENT =====

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

  getMatchHistory(): Observable<MatchHistoryEntry[]> {
    const user = this.getUser();
    if (!user) return of([]);
    return this.http.get<MatchHistoryEntry[]>(`${this.apiUrl}/users/${user.discordId}/history`);
  }

  setMain(main: string): Observable<User | null> {
    const token = localStorage.getItem("jwt");
    if (!token) return of(null);

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http
      .post<User>(`${this.apiUrl}/users/set-main`, { main }, { headers })
      .pipe(tap((user) => this.setUser(user)));
  }

  // ===== MATCHMAKING =====

  private initializeSocket() {
    const token = localStorage.getItem("jwt");
    if (!token) return;

    if (this.socket && this.socket.connected) return;

    this.socket = io(this.apiUrl, { transports: ["websocket"] });

    this.socket.on("connect", () => {
      console.log("🔌 Connected to match server");
      this.socket?.emit("authenticate", token);
    });

    this.socket.on("authenticated", (data) => {
      if (data.success) {
        console.log("Socket authenticated:", data.user);
      } else {
        console.warn("Socket authentication failed");
      }
    });

    this.socket.on("searching", (data) => {
      this.searchingSubject.next(true);
      this.searchMessageSubject.next(data.message);
    });

    this.socket.on("matchPending", (data: PendingMatch) => {
      this.searchingSubject.next(false);
      this.searchMessageSubject.next("");
      this.pendingMatchSubject.next(data);
      console.log("Match pending — ready check started:", data.opponent);
    });

    this.socket.on("matchConfirmed", (data: { opponent: MatchOpponent }) => {
      this.pendingMatchSubject.next(null);
      this.matchSubject.next(data.opponent);
      console.log("Match confirmed:", data.opponent);
    });

    this.socket.on("matchDeclined", (data: { message: string }) => {
      this.pendingMatchSubject.next(null);
      this.searchingSubject.next(false);
      this.searchMessageSubject.next(data.message);
      console.log("Match declined:", data.message);
    });

    this.socket.on("requeueing", (data: { message: string }) => {
      this.pendingMatchSubject.next(null);
      this.searchMessageSubject.next(data.message);
      // searching$ is set back to true by the subsequent 'searching' event from the server
      console.log("Re-queued:", data.message);
    });

    this.socket.on("searchStopped", () => {
      this.searchingSubject.next(false);
      this.searchMessageSubject.next("Search stopped");
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from match server");
      this.searchingSubject.next(false);
      this.pendingMatchSubject.next(null);
    });

    this.socket.on("error", (msg) => {
      console.error("Match socket error:", msg);
    });
  }

  startSearch(main: string, lookingFor: string[]) {
    if (!this.socket?.connected) this.initializeSocket();
    this.socket?.emit("startSearch", { main, lookingFor });
  }

  stopSearch() {
    this.socket?.emit("stopSearch");
  }

  readyUp(matchId: string) {
    this.socket?.emit("readyUp", { matchId });
  }
}
