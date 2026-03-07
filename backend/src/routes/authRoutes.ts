import axios from 'axios';
import jwt from 'jsonwebtoken';
import { Router } from 'express';
import config from '../config/config';
import { User } from '../models/user';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.get('/discord', (_req, res) => {
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

    let user = await User.findOne({ where: { discordId: discordUser.id } });
    if (!user) {
      user = await User.create({
        discordId: discordUser.id,
        username: discordUser.username,
        discriminator: discordUser.discriminator,
        email: discordUser.email,
        avatar: discordUser.avatar,
      });
    } else {
      await user.update({
        username: discordUser.username,
        discriminator: discordUser.discriminator,
        email: discordUser.email,
        avatar: discordUser.avatar,
      });
    }

    const token = jwt.sign(
      {
        id: user.discordId,
        username: user.username,
        avatar: user.avatar,
        email: user.email,
      },
      config.jwtSecret,
      { expiresIn: '14d' },
    );

    res.redirect(`${config.frontendUrl}/auth_success?token=${token}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Authentication failed');
  }
});

router.get('/profile', authenticateJWT, (req, res) => {
  res.json(req.user);
});

export default router;
