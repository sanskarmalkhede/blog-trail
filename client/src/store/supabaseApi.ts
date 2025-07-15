import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface Post {
  id: number;
  author_id: string;
  title: string;
  content: string;
  image_url?: string | null;
  created_at: string;
  author_name?: string;
  author_email?: string;
  likes_count?: number;
  is_liked?: boolean;
}

export interface Comment {
  id: number;
  post_id: number;
  author_id: string;
  content: string;
  created_at: string;
  author_name?: string;
  author_email?: string;
  likes_count?: number;
  is_liked?: boolean;
}

export const supabaseApi = createApi({
  reducerPath: 'supabaseApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Post', 'Comment', 'Auth'],
  endpoints: (builder) => ({
    // Auth endpoints
    signUp: builder.mutation<{ user: User | null; session: Session | null }, { email: string; password: string; name: string }>({
      queryFn: async ({ email, password, name }) => {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
              },
            },
          });
          
          if (error) throw error;
          return { data };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Auth'],
    }),
    
    signIn: builder.mutation<{ user: User | null; session: Session | null }, { email: string; password: string }>({
      queryFn: async ({ email, password }) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) throw error;
          return { data };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Auth'],
    }),
    
    signOut: builder.mutation<void, void>({
      queryFn: async () => {
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          return { data: undefined };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Auth'],
    }),
    
    // Posts endpoints
    getPosts: builder.query<Post[], void>({
      queryFn: async () => {
        try {
          const { data, error } = await supabase
            .from('posts')
            .select(`
              *,
              profiles:author_id (name, email),
              likes:likes(count),
              user_likes:likes!inner(user_id)
            `)
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          return { data: data || [] };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
      providesTags: ['Post'],
    }),
    
    createPost: builder.mutation<Post, Partial<Post>>({
      queryFn: async (newPost) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Not authenticated');
          
          const { data, error } = await supabase
            .from('posts')
            .insert([{ ...newPost, author_id: user.id }])
            .select()
            .single();
          
          if (error) throw error;
          return { data };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Post'],
    }),
    
    updatePost: builder.mutation<Post, { id: number; data: Partial<Post> }>({
      queryFn: async ({ id, data: updateData }) => {
        try {
          const { data, error } = await supabase
            .from('posts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
          
          if (error) throw error;
          return { data };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Post'],
    }),
    
    deletePost: builder.mutation<void, { id: number }>({
      queryFn: async ({ id }) => {
        try {
          const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', id);
          
          if (error) throw error;
          return { data: undefined };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Post'],
    }),
  }),
});

export const {
  useSignUpMutation,
  useSignInMutation,
  useSignOutMutation,
  useGetPostsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
} = supabaseApi; 