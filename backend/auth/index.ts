import express from 'express';
import { login } from './login';
import { signup } from './signup';

const router = express.Router();

// Auth routes
router.post('/login', login);
router.post('/signup', signup);

export default router; 