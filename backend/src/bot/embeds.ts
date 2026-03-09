import { EmbedBuilder, EmbedFooterOptions } from 'discord.js';

export const COLORS = {
  brand:   0xD96CFF, // SmashUps purple
  success: 0x57F287, // Discord green
  danger:  0xED4245, // Discord red
  warning: 0xFEE75C, // Discord yellow
  info:    0x5865F2, // Discord blurple
} as const;

export const FOOTER: EmbedFooterOptions = { text: 'SmashUps' };

export function avatarUrl(discordId: string, avatar?: string | null): string {
  if (!avatar) return 'https://cdn.discordapp.com/embed/avatars/0.png';
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png?size=256`;
}

/** Discord timestamp tag — defaults to relative (R) */
export function ts(ms: number, style: 'R' | 'F' | 'D' | 'T' = 'R'): string {
  return `<t:${Math.floor(ms / 1000)}:${style}>`;
}

/** Inline Discord user mention */
export function mention(discordId: string): string {
  return `<@${discordId}>`;
}

export function base(color: number): EmbedBuilder {
  return new EmbedBuilder().setColor(color).setFooter(FOOTER).setTimestamp();
}
