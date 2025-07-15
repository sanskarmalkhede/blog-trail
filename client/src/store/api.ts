import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

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
  author_name?: string;
  author_email?: string;
  likes_count?: number;
  is_liked?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author_name?: string;
  author_email?: string;
  likes_count?: number;
  is_liked?: boolean;
}

export const blogApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || "https://blog-trail-ensi.onrender.com",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.session?.access_token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Post", "Comment", "Auth"],
  endpoints: (builder) => ({
    // Auth
    signup: builder.mutation<{ user: User; token: string }, { name: string; email: string; password: string }>({
      query: (body) => ({ url: "/auth/signup", method: "POST", body }),
    }),
    login: builder.mutation<{ user: User; token: string }, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    getMe: builder.query<User, void>({
      query: () => ({ url: "/auth/me", method: "GET" }),
      providesTags: ["Auth"],
    }),
    // Posts
    getPosts: builder.query<Post[], void>({
      query: () => ({ url: "/posts", method: "GET" }),
      providesTags: ["Post"],
    }),
    createPost: builder.mutation<Post, Partial<Post>>({
      query: (body) => ({ url: "/posts", method: "POST", body }),
      invalidatesTags: ["Post"],
    }),
    updatePost: builder.mutation<Post, { id: string; title: string; content: string; image_url?: string }>({
      query: ({ id, ...data }) => ({ url: `/posts/${id}`, method: "PATCH", body: data }),
      invalidatesTags: ["Post"],
    }),
    deletePost: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({ url: `/posts/${id}`, method: "DELETE" }),
      invalidatesTags: ["Post"],
    }),
    likePost: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({ url: `/posts/${id}/like`, method: "POST" }),
      invalidatesTags: ["Post"],
    }),
    unlikePost: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({ url: `/posts/${id}/unlike`, method: "POST" }),
      invalidatesTags: ["Post"],
    }),
    // Comments
    getComments: builder.query<Comment[], string>({
      query: (postId) => ({ url: `/posts/${postId}/comments`, method: "GET" }),
      providesTags: (_, __, postId) => [{ type: 'Comment', id: postId }],
    }),
    addComment: builder.mutation<Comment, { postId: string; content: string }>({
      query: ({ postId, content }) => ({ url: `/posts/${postId}/comments`, method: "POST", body: { content } }),
      invalidatesTags: (_, __, { postId }) => [{ type: 'Comment', id: postId }],
    }),
    deleteComment: builder.mutation<void, { id: string; postId: string }>({
      query: ({ id }) => ({ url: `/comments/${id}`, method: "DELETE" }),
      invalidatesTags: (_, __, { postId }) => [{ type: 'Comment', id: postId }],
    }),
    likeComment: builder.mutation<void, { id: string; postId: string }>({
      query: ({ id }) => ({ url: `/comments/${id}/like`, method: "POST" }),
      invalidatesTags: (_, __, { postId }) => [{ type: 'Comment', id: postId }],
    }),
    unlikeComment: builder.mutation<void, { id: string; postId: string }>({
      query: ({ id }) => ({ url: `/comments/${id}/unlike`, method: "POST" }),
      invalidatesTags: (_, __, { postId }) => [{ type: 'Comment', id: postId }],
    }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useGetMeQuery,
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