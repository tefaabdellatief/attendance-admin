import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase.service';

export interface RequestStatus {
  id?: string;
  code: string;
  name_ar: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RequestStatusService {
  private tableName = 'request_statuses';

  constructor(private supabase: SupabaseService) {}

  async getAll() {
    const { data, error } = await this.supabase.table(this.tableName)
      .select('*')
      .order('name_ar');
    
    if (error) throw error;
    return data || [];
  }

  async getById(id: string) {
    const { data, error } = await this.supabase.table(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async create(status: Omit<RequestStatus, 'id'>) {
    const { data, error } = await this.supabase.table(this.tableName)
      .insert([status])
      .select();
    
    if (error) throw error;
    return data?.[0];
  }

  async update(id: string, updates: Partial<RequestStatus>) {
    const { data, error } = await this.supabase.table(this.tableName)
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data?.[0];
  }

  async delete(id: string) {
    const { error } = await this.supabase.table(this.tableName)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
}
