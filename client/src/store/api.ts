import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../lib/supabase";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string;
  image_url?: string | null;
  created_at: string;
  profiles?: {
    name: string;
    email: string;
  };
  likes_count?: number;
  is_liked?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  profiles?: {
    name: string;
    email: string;
  };
  likes_count?: number;
  is_liked?: boolean;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

// Type for the root state
export interface RootState {
  auth: {
    user: SupabaseUser | null;
    session: Session | null;
    loading: boolean;
    error: string | null;
  };
  api: any;
}

export const blogApi = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Post", "Comment"],
  endpoints: (builder) => ({
    // Posts
    getPosts: builder.query<Post[], void>({
      queryFn: async (_, { getState }) => {
        try {
          const state = getState() as RootState;
          const userId = state.auth.user?.id;

          // Get posts with author info
          const { data: posts, error: postsError } = await supabase
            .from('posts')
            .select(`
              *,
              profiles:author_id (
                name,
                email
              )
            `)
            .order('created_at', { ascending: false });

          if (postsError) throw postsError;

          // Get likes count and user's like status for each post
          const postsWithLikes: Post[] = await Promise.all(
            (posts || []).map(async (post): Promise<Post> => {
              // Get likes count
              const { count: likesCount } = await supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);

              // Check if current user liked this post
              let isLiked = false;
              if (userId) {
                const { data: userLike } = await supabase
                  .from('likes')
                  .select('id')
                  .eq('post_id', post.id)
                  .eq('user_id', userId)
                  .single();
                
                isLiked = !!userLike;
              }

              return {
                ...post,
                likes_count: likesCount || 0,
                is_liked: isLiked,
              };
            })
          );

          return { data: postsWithLikes };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: ["Post"],
    }),

    createPost: builder.mutation<Post, { title: string; content: string; image_url?: string }>({
      queryFn: async (postData, { getState }) => {
        try {
          const state = getState() as RootState;
          const userId = state.auth.user?.id;

          if (!userId) {
            throw new Error('User not authenticated');
          }

          const { data, error } = await supabase
            .from('posts')
            .insert([{
              ...postData,
              author_id: userId,
            }])
            .select(`
              *,
              profiles:author_id (
                name,
                email
              )
            `)
            .single();

          if (error) throw error;

          return { data: { ...data, likes_count: 0, is_liked: false } };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ["Post"],
    }),

    updatePost: builder.mutation<Post, { id: string; title: string; content: string; image_url?: string }>({
      queryFn: async ({ id, ...updateData }, { getState }) => {
        try {
          const state = getState() as RootState;
          const userId = state.auth.user?.id;

          if (!userId) {
            throw new Error('User not authenticated');
          }

          const { data, error } = await supabase
            .from('posts')
            .update(updateData)
            .eq('id', id)
            .eq('author_id', userId) // Ensure user can only update their own posts
            .select(`
              *,
              profiles:author_id (
                name,
                email
              )
            `)
            .single();

          if (error) throw error;

          return { data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ["Post"],
    }),

    deletePost: builder.mutation<void, { id: string }>({
      queryFn: async ({ id }, { getState }) => {
        try {
          const state = getState() as RootState;
          const userId = state.auth.user?.id;

          if (!userId) {
            throw new Error('User not authenticated');
          }

          const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', id)
            .eq('author_id', userId); // Ensure user can only delete their own posts

          if (error) throw error;

          return { data: undefined };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ["Post"],
    }),

    likePost: builder.mutation<void, { id: string }>({
      queryFn: async ({ id }, { getState }) => {
        try {
          const state = getState() as RootState;
          const userId = state.auth.user?.id;

          if (!userId) {
            throw new Error('User not authenticated');
          }

          const { error } = await supabase
            .from('likes')
            .insert([{
              post_id: id,
              user_id: userId,
            }]);

          if (error) throw error;

          return { data: undefined };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ["Post"],
    }),

    unlikePost: builder.mutation<void, { id: string }>({
      queryFn: async ({ id }, { getState }) => {
        try {
          const state = getState() as RootState;
          const userId = state.auth.user?.id;

          if (!userId) {
            throw new Error('User not authenticated');
          }

          const { error } = await supabase
            .from('likes')
            .delete()
            .eq('post_id', id)
            .eq('user_id', userId);

          if (error) throw error;

          return { data: undefined };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ["Post"],
    }),

    // Comments
    getComments: builder.query<Comment[], string>({
      queryFn: async (postId, { getState }) => {
        try {
          const state = getState() as RootState;
          const userId = state.auth.user?.id;

          // Get comments with author info
          const { data: comments, error: commentsError } = await supabase
            .from('comments')
            .select(`
              *,
              profiles:author_id (
                name,
                email
              )
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

          if (commentsError) throw commentsError;

          // Get likes count and user's like status for each comment
          const commentsWithLikes: Comment[] = await Promise.all(
            (comments || []).map(async (comment): Promise<Comment> => {
              // Get likes count
              const { count: likesCount } = await supabase
                .from('comment_likes')
                .select('*', { count: 'exact', head: true })
                .eq('comment_id', comment.id);

              // Check if current user liked this comment
              let isLiked = false;
              if (userId) {
                const { data: userLike } = await supabase
                  .from('comment_likes')
                  .select('id')
                  .eq('comment_id', comment.id)
                  .eq('user_id', userId)
                  .single();
                
                isLiked = !!userLike;
              }

              return {
                ...comment,
                likes_count: likesCount || 0,
                is_liked: isLiked,
              };
            })
          );

          return { data: commentsWithLikes };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: (_, __, postId) => [{ type: 'Comment', id: postId }],
    }),

    addComment: builder.mutation<Comment, { postId: string; content: string }>({
      queryFn: async ({ postId, content }, { getState }) => {
        try {
          const state = getState() as RootState;
          const userId = state.auth.user?.id;

          if (!userId) {
            throw new Error('User not authenticated');
          }

          const { data, error } = await supabase
            .from('comments')
            .insert([{
              post_id: postId,
              author_id: userId,
              content,
            }])
            .select(`
              *,
              profiles:author_id (
                name,
                email
              )
            `)
            .single();

          if (error) throw error;

          return { data: { ...data, likes_count: 0, is_liked: false } };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: (_, __, { postId }) => [{ type: 'Comment', id: postId }],
    }),

    deleteComment: builder.mutation<void, { id: string; postId: string }>({
      queryFn: async ({ id }, { getState }) => {
        try {
          const state = getState() as RootState;
          const userId = state.auth.user?.id;

          if (!userId) {
            throw new Error('User not authenticated');
          }

          // Check if user is the comment author or the post owner
          const { data: comment } = await supabase
            .from('comments')
            .select('author_id, posts:post_id(author_id)')
            .eq('id', id)
            .single();

          if (!comment) {
            throw new Error('Comment not found');
          }

          const isCommentAuthor = comment.author_id === userId;
          const isPostOwner = (comment.posts as any)?.author_id === userId;

          if (!isCommentAuthor && !isPostOwner) {
            throw new Error('Not authorized to delete this comment');
          }

          const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', id);

          if (error) throw error;

          return { data: undefined };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: (_, __, { postId }) => [{ type: 'Comment', id: postId }],
    }),

    likeComment: builder.mutation<void, { id: string; postId: string }>({
      queryFn: async ({ id }, { getState }) => {
        try {
          const state = getState() as RootState;
          const userId = state.auth.user?.id;

          if (!userId) {
            throw new Error('User not authenticated');
          }

          const { error } = await supabase
            .from('comment_likes')
            .insert([{
              comment_id: id,
              user_id: userId,
            }]);

          if (error) throw error;

          return { data: undefined };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: (_, __, { postId }) => [{ type: 'Comment', id: postId }],
    }),

    unlikeComment: builder.mutation<void, { id: string; postId: string }>({
      queryFn: async ({ id }, { getState }) => {
        try {
          const state = getState() as RootState;
          const userId = state.auth.user?.id;

          if (!userId) {
            throw new Error('User not authenticated');
          }

          const { error } = await supabase
            .from('comment_likes')
            .delete()
            .eq('comment_id', id)
            .eq('user_id', userId);

          if (error) throw error;

          return { data: undefined };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: (_, __, { postId }) => [{ type: 'Comment', id: postId }],
    }),
  }),
});

export const {
  useGetPostsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useLikePostMutation,
  useUnlikePostMutation,
  useGetCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useLikeCommentMutation,
  useUnlikeCommentMutation,
} = blogApi; 