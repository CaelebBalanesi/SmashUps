export interface User {
  discordId: string;
  dateJoined: number;
  username: string;
  discriminator: string;
  email?: string;
  avatar?: string;
  main?: string;
}

export const users: User[] = [];
