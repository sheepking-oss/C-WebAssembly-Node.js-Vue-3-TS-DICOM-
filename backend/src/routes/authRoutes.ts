import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = Router();

const mockUsers = [
  {
    id: '1',
    username: 'doctor1',
    password: 'doctor123',
    role: 'doctor',
    name: '张医生',
    department: '放射科'
  },
  {
    id: '2',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: '管理员',
    department: '信息科'
  }
];

interface LoginRequestBody {
  username: string;
  password: string;
}

router.post(
  '/login',
  (req: Request<{}, {}, LoginRequestBody>, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw new AppError('用户名和密码不能为空', 400, 'VALIDATION_ERROR');
      }

      const user = mockUsers.find(
        (u) => u.username === username && u.password === password
      );

      if (!user) {
        throw new AppError('用户名或密码错误', 401, 'AUTH_ERROR');
      }

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role
        },
        process.env.JWT_SECRET as string,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        }
      );

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            department: user.department
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/me',
  authenticate,
  (req: any, res: Response, next: NextFunction) => {
    try {
      const user = mockUsers.find((u) => u.id === req.user.id);

      if (!user) {
        throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          department: user.department
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/logout',
  authenticate,
  (req: Request, res: Response) => {
    res.json({
      success: true,
      message: '已成功登出'
    });
  }
);

export default router;
