import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

export class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, name } = req.validated.body;

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email already exists'
          }
        });
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { name },
        email_confirm: true
      });

      if (authError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'REGISTRATION_FAILED',
            message: authError.message
          }
        });
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { 
            user_id: authData.user.id, 
            name,
            email 
          }
        ]);

      if (profileError) {
        // Cleanup: delete the auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: authData.user.id, email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email,
            name
          },
          token
        }
      });

    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.validated.body;

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', data.user.id)
        .single();

      // Generate JWT token
      const token = jwt.sign(
        { userId: data.user.id, email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            name: profile?.name
          },
          token,
          session: data.session
        }
      });

    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'LOGOUT_FAILED',
            message: error.message
          }
        });
      }

      res.json({
        success: true,
        data: {
          message: 'Logged out successfully'
        }
      });

    } catch (error) {
      next(error);
    }
  }
}