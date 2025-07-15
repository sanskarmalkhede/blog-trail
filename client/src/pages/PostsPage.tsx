import { Button } from "../components/ui/button";
import {
  useDeletePostMutation,
  useGetPostsQuery,
  useLikePostMutation,
  useUnlikePostMutation,
} from "../store/api";
import { useAppSelector } from "../hooks/useTypedHooks";
import { Link } from "react-router-dom";
import { Heart, Edit, Trash2, Calendar, User, Image, ChevronDown, ChevronUp } from "lucide-react";
import { CommentSection } from "../components/CommentSection";
import { useState } from "react";

function PostsPage() {
  const { data: posts, isLoading } = useGetPostsQuery();
  const [like] = useLikePostMutation();
  const [unlike] = useUnlikePostMutation();
  const [deletePost] = useDeletePostMutation();
  const auth = useAppSelector((state) => state.auth);
  
  // State to track which posts are expanded
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  const togglePostExpansion = (postId: string) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-muted/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Image className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
        <p className="text-muted-foreground mb-6">
          Be the first to share something amazing!
        </p>
        {auth.user && (
          <Button asChild className="btn-material elevation-2 rounded-xl">
            <Link to="/create">Create First Post</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Latest Posts</h1>
        <p className="text-muted-foreground">
          Discover stories, ideas, and insights from our community
        </p>
      </div>

      {/* Posts Grid */}
      <div className="space-y-6">
        {posts?.map((post) => {
          const isOwner = post.author_id === auth.user?.id;
          const p: any = post;
          const authorName = p.author_name || p.profiles?.name || 'Anonymous';
          const isExpanded = expandedPosts.has(post.id);
          const shouldTruncate = post.content.length > 300;
          const displayContent = shouldTruncate && !isExpanded 
            ? `${post.content.substring(0, 300)}...` 
            : post.content;
          
          return (
            <article 
              key={post.id} 
              className="bg-card rounded-2xl p-6 elevation-1 hover:elevation-2 transition-all duration-300 animate-fade-in"
            >
              {/* Post Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-full p-2">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {authorName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                {/* Owner Actions */}
                {isOwner && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild className="btn-material rounded-xl">
                      <Link to={`/edit/${post.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePost({ id: post.id })}
                      className="text-destructive hover:text-destructive btn-material rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Post Content */}
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-3 leading-tight">
                  {post.title}
                </h2>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {displayContent}
                  </p>
                </div>
                
                {/* Read More/Less Button - placed right after content */}
                {shouldTruncate && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => togglePostExpansion(post.id)}
                    className="mt-2 text-primary hover:text-primary/80 btn-material rounded-xl p-1 h-auto"
                  >
                    <span className="flex items-center gap-1 text-sm">
                      {isExpanded ? (
                        <>
                          Read Less
                          <ChevronUp className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          Read More
                          <ChevronDown className="h-3 w-3" />
                        </>
                      )}
                    </span>
                  </Button>
                )}
              </div>

              {/* Post Image */}
              {post.image_url && (
                <div className="mb-4">
                  <img
                    src={post.image_url}
                    alt="Post image"
                    className="w-full h-48 object-cover rounded-xl elevation-1"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4">
                  {auth.user && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        post.is_liked
                          ? unlike({ id: post.id })
                          : like({ id: post.id })
                      }
                      className="flex items-center gap-2 hover:text-red-500 btn-material rounded-xl"
                    >
                      <Heart 
                        className={`h-4 w-4 ${
                          post.is_liked ? 'fill-red-500 text-red-500 stroke-red-500' : ''
                        }`} 
                      />
                      <span className="text-sm font-medium">
                        {post.likes_count || 0}
                      </span>
                    </Button>
                  )}
                  
                  {!auth.user && (post.likes_count || 0) > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Heart className="h-4 w-4" />
                      <span className="text-sm">{post.likes_count || 0}</span>
                    </div>
                  )}
                </div>
              </div>

              <CommentSection postId={post.id} postAuthorId={post.author_id} />

            </article>
          );
        })}
      </div>
    </div>
  );
}

export default PostsPage; 