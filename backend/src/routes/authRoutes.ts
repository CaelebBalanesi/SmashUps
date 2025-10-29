import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Router } from 'express';
import config from '../config/config';

const router = Router();

router.get('/discord', (req, res) => {
  const authUrl = `https://discord.com/oauth2/authorize?client_id=${config.discordClientID}&redirect_uri=${encodeURIComponent(
    config.redirectURI,
  )}&response_type=code&scope=identify%20email`;
  res.redirect(authUrl);
});

router.get('/discord/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Missing Code');

  try {
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: config.discordClientID,
        client_secret: config.discordClientSecret,
        grant_type: 'authorization_code',
        code: code.toString(),
        redirect_uri: config.redirectURI,
        scope: 'identify email',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    const accessToken = tokenResponse.data.access_token;
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const discordUser = userResponse.data;

    const token = jwt.sign(
      {
        id: discordUser.id,
        username: discordUser.username,
        avatar: discordUser.avatar,
        email: discordUser.email,
      },
      config.jwtSecret,
      { expiresIn: '1h' },
    );
    res.redirect(`${config.frontendUrl}/auth_success?token=${token}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Authentication failed');
  }
});

router.get('/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing token' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    res.json(decoded);
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
});

export default router;
