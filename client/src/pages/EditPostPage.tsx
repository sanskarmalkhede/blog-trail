import { useParams, useNavigate } from "react-router-dom";
import { useGetPostsQuery, useUpdatePostMutation } from "../store/api";
import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const { data: posts } = useGetPostsQuery();
  const post = posts?.find((p) => p.id === postId);
  const [updatePost] = useUpdatePostMutation();
  const navigate = useNavigate();

  const [title, setTitle] = useState(post?.title || "");
  const [content, setContent] = useState(post?.content || "");
  const [imageUrl, setImageUrl] = useState(post?.image_url || "");

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
      setImageUrl(post.image_url || "");
    }
  }, [post]);

  if (!post) {
    return <p className="text-center">Loading...</p>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePost({ id: postId, data: { title, content, image_url: imageUrl } }).unwrap();
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-input rounded-xl p-3 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all elevation-1 focus:elevation-2"
        />
        <Textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[200px] border border-input rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all elevation-1 focus:elevation-2"
        />
        <input
          type="text"
          placeholder="Image URL (optional)"
          value={imageUrl || ""}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full border border-input rounded-xl p-3 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all elevation-1 focus:elevation-2"
        />
        <Button type="submit" disabled={!title || !content}>
          Save Changes
        </Button>
      </form>
    </div>
  );
} 