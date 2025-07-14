import { useState } from "react";
import { useAppSelector } from "../hooks/useTypedHooks";
import { useAddCommentMutation, useDeleteCommentMutation, useGetCommentsQuery, type Comment } from "../store/api";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Trash2 } from "lucide-react";

type CommentSectionProps = {
  postId: number;
  postAuthorId: number;
};

export function CommentSection({ postId, postAuthorId }: CommentSectionProps) {
  const auth = useAppSelector((state) => state.auth);
  const { data: comments, isLoading } = useGetCommentsQuery(postId);
  const [addComment] = useAddCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [newComment, setNewComment] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await addComment({ postId, content: newComment });
      setNewComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  if (isLoading) return <div>Loading comments...</div>;

  return (
    <div className="mt-6">
      <h4 className="font-semibold mb-4">Comments ({comments?.length || 0})</h4>
      <div className="space-y-4 mb-6">
        {comments && comments.length > 0 ? (
          comments.map((comment: Comment) => (
            <div key={comment.id} className="border-b pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{comment.author_name}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-foreground">{comment.content}</p>
                </div>
                {(comment.author_id === auth.user?.id || postAuthorId === auth.user?.id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteComment({ id: comment.id, postId })}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
        )}
      </div>
      {auth.user ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <Button type="submit" disabled={!newComment.trim()}>Post Comment</Button>
        </form>
      ) : (
        <p className="text-muted-foreground">Please log in to add a comment.</p>
      )}
    </div>
  );
} 