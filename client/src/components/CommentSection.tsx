import { useState } from "react";
import { useAppSelector } from "../hooks/useTypedHooks";
import { useAddCommentMutation, useDeleteCommentMutation, useGetCommentsQuery, type Comment } from "../store/api";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Trash2, Heart } from "lucide-react";
import { useLikeCommentMutation, useUnlikeCommentMutation } from "../store/api";

type CommentSectionProps = {
  postId: string;
  postAuthorId: string;
};

export function CommentSection({ postId, postAuthorId }: CommentSectionProps) {
  const auth = useAppSelector((state) => state.auth);
  const { data: comments, isLoading } = useGetCommentsQuery(postId);
  const [addComment] = useAddCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [newComment, setNewComment] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [likeComment] = useLikeCommentMutation();
  const [unlikeComment] = useUnlikeCommentMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await addComment({ postId, content: newComment });
      setNewComment("");
      setShowInput(false);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-4 pt-4 border-t">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-20 mb-3"></div>
          <div className="space-y-3">
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-sm">
          Comments {comments && comments.length > 0 && `(${comments.length})`}
        </h4>
        {auth.user && !showInput && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowInput(true)}
            className="btn-material rounded-xl"
          >
            Write a comment
          </Button>
        )}
      </div>

      {/* Add Comment Form */}
      {auth.user && showInput && (
        <form onSubmit={handleSubmit} className="mb-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your comment..."
            className="mb-2 resize-none rounded-xl"
            rows={3}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="btn-material rounded-xl">
              Post Comment
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setShowInput(false);
                setNewComment("");
              }}
              className="btn-material rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Comments List */}
      {comments && comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment: Comment) => {
            const isCommentOwner = comment.author_id === auth.user?.id;
            const isPostOwner = postAuthorId === auth.user?.id;
            const canDelete = isCommentOwner || isPostOwner;
            const authorName = (comment as any).author_name || 'Anonymous';

            return (
              <div key={comment.id} className="bg-muted/30 rounded-xl p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-sm">{authorName}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteComment({ id: comment.id, postId })}
                      className="text-destructive hover:text-destructive p-1 h-auto"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-sm mb-2 whitespace-pre-wrap">{comment.content}</p>
                
                {/* Comment Like Button */}
                {auth.user && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        comment.is_liked
                          ? unlikeComment({ id: comment.id, postId })
                          : likeComment({ id: comment.id, postId })
                      }
                      className="flex items-center gap-1 hover:text-red-500 p-1 h-auto"
                    >
                      <Heart 
                        className={`h-3 w-3 ${
                          comment.is_liked ? 'fill-red-500 text-red-500 stroke-red-500' : ''
                        }`} 
                      />
                      <span className="text-xs">
                        {comment.likes_count || 0}
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No comments yet. Be the first to comment!</p>
      )}
    </div>
  );
} 