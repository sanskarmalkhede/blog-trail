import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Post {
  id: number;
  author_id: number;
  title: string;
  content: string;
  image_url?: string | null;
  created_at: string;
  author_name: string;
  author_email: string;
  likes_count: number;
}

export const blogApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:3000",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Post", "Auth"],
  endpoints: (builder) => ({
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
      query: () => "/posts",
      providesTags: ["Post"],
    }),
    createPost: builder.mutation<Post, Partial<Post>>({
      query: (body) => ({ url: "/posts", method: "POST", body }),
      invalidatesTags: ["Post"],
    }),
    updatePost: builder.mutation<Post, { id: number; data: Partial<Post> }>({
      query: ({ id, data }) => ({ url: `/posts/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["Post"],
    }),
    deletePost: builder.mutation<void, { id: number }>({
      query: ({ id }) => ({ url: `/posts/${id}`, method: "DELETE" }),
      invalidatesTags: ["Post"],
    }),
    likePost: builder.mutation<void, { id: number }>({
      query: ({ id }) => ({ url: `/posts/${id}/like`, method: "POST" }),
      invalidatesTags: ["Post"],
    }),
    unlikePost: builder.mutation<void, { id: number }>({
      query: ({ id }) => ({ url: `/posts/${id}/unlike`, method: "POST" }),
      invalidatesTags: ["Post"],
    }),
    addComment: builder.mutation<{ id: number; post_id: number; content: string }, { postId: number; content: string }>({
      query: ({ postId, content }) => ({ url: `/posts/${postId}/comments`, method: "POST", body: { content } }),
      invalidatesTags: ["Post"],
    }),
    deleteComment: builder.mutation<void, { id: number }>({
      query: ({ id }) => ({ url: `/comments/${id}`, method: "DELETE" }),
      invalidatesTags: ["Post"],
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
  useAddCommentMutation,
  useDeleteCommentMutation,
} = blogApi; 