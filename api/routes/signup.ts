import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || name.length < 1) {
    return res.status(400).json({ error: '名前は1文字以上必要です' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'メールアドレスの形式が正しくありません' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'パスワードは6文字以上必要です' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'このメールアドレスは既に登録されています' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    const token = jwt.sign({ email: user.email, id: user.id }, 'your-secret-key', {
      expiresIn: '40h',
    });

    return res.status(200).json({ message: 'サインアップ成功', token, userId: user.id });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

app.listen(3000, () => {
  console.log('APIサーバーがポート3000で起動中');
});
