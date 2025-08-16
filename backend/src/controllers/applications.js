import { supabase } from '../config/supabase.js';
import { NotFoundError } from '../middleware/error.js';

export class ApplicationController {
  async getApplications(req, res, next) {
    try {
      const userId = req.user.id;
      const { search, status, portal, from, to, page = 1, limit = 10, sort = 'created_at' } = req.validated.query;

      let query = supabase
        .from('applications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Apply filters
      if (search) {
        query = query.or(`company.ilike.%${search}%,position.ilike.%${search}%`);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (portal) {
        query = query.eq('portal', portal);
      }

      if (from) {
        query = query.gte('date_applied', from);
      }

      if (to) {
        query = query.lte('date_applied', to);
      }

      // Apply sorting
      const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
      const ascending = !sort.startsWith('-');
      query = query.order(sortField, { ascending });

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      res.json({
        success: true,
        data: {
          applications: data || [],
          pagination: {
            page,
            limit,
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const userId = req.user.id;

      const { data, error } = await supabase
        .from('applications')
        .select('status, created_at')
        .eq('user_id', userId);

      if (error) throw error;

      const total = data.length;
      const byStatus = data.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {});

      //all statuses are present
      const allStatuses = ['SAVED', 'APPLIED', 'PENDING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
      allStatuses.forEach(status => {
        if (!byStatus[status]) byStatus[status] = 0;
      });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const last30Days = {
        count: data.filter(app => new Date(app.created_at) >= thirtyDaysAgo).length
      };

      res.json({
        success: true,
        data: {
          total,
          byStatus,
          last30Days
        }
      });

    } catch (error) {
      next(error);
    }
  }

  async createApplication(req, res, next) {
    try {
      const userId = req.user.id;
      const applicationData = {
        ...req.validated.body,
        user_id: userId,
        source: 'MANUAL'
      };

      const { data, error } = await supabase
        .from('applications')
        .insert([applicationData])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        data: data
      });

    } catch (error) {
      next(error);
    }
  }

  async updateApplication(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.validated.params;
      const updates = req.validated.body;

      const { data, error } = await supabase
        .from('applications')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        throw new NotFoundError('Application not found');
      }

      res.json({
        success: true,
        data: data
      });

    } catch (error) {
      next(error);
    }
  }

  async deleteApplication(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.validated.params;

      const { data, error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        throw new NotFoundError('Application not found');
      }

      res.json({
        success: true,
        data: {
          message: 'Application deleted successfully'
        }
      });

    } catch (error) {
      next(error);
    }
  }

  async uploadResume(req, res, next) {
    try {
      // This is a placeholder for Cloudinary integration
      // In a real implementation, you would handle file upload here
      // and return the URL from Cloudinary
      
      res.json({
        success: true,
        data: {
          message: 'Resume upload functionality to be implemented with Cloudinary',
          url: 'https://placeholder-resume-url.com'
        }
      });

    } catch (error) {
      next(error);
    }
  }
}