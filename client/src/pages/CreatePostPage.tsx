import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../components/ui/button";
import { useCreatePostMutation } from "../store/api";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Image } from "lucide-react";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  image_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

function CreatePostPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const [createPost, { isLoading }] = useCreatePostMutation();
  const navigate = useNavigate();

  const watchedContent = watch("content", "");

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      await createPost({ ...data, image_url: data.image_url || undefined }).unwrap();
      navigate("/");
    } catch (e) {
      // Error is handled by RTK Query
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="rounded-full btn-material">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New Post</h1>
          <p className="text-muted-foreground">Share your thoughts with the community</p>
        </div>
      </div>

      {/* Create Post Form */}
      <div className="bg-card rounded-2xl p-8 elevation-2 animate-fade-in">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Title
            </label>
            <input
              type="text"
              placeholder="Enter an engaging title..."
              className="w-full px-4 py-3 border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-lg font-medium elevation-1 focus:elevation-2"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-destructive mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Content Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Content
              </label>
              <span className="text-xs text-muted-foreground">
                {watchedContent.length} characters
              </span>
            </div>
            <textarea
              rows={12}
              placeholder="Tell your story..."
              className="w-full px-4 py-3 border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none leading-relaxed elevation-1 focus:elevation-2"
              {...register("content")}
            />
            {errors.content && (
              <p className="text-xs text-destructive mt-1">
                {errors.content.message}
              </p>
            )}
          </div>

          {/* Image URL Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Image className="h-4 w-4" />
              Featured Image (Optional)
            </label>
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all elevation-1 focus:elevation-2"
              {...register("image_url")}
            />
            {errors.image_url && (
              <p className="text-xs text-destructive mt-1">
                {errors.image_url.message as string}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Add an image URL to make your post more engaging
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="btn-material rounded-xl"
            >
              Cancel
            </Button>
            
            <Button 
              type="submit"
              disabled={isLoading} 
              className="flex items-center gap-2 btn-material elevation-2 hover:elevation-3 rounded-xl"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Publish Post
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Writing Tips */}
      <div className="mt-8 bg-muted/30 rounded-2xl p-6 elevation-1">
        <h3 className="font-semibold mb-3">Writing Tips</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• Use a clear, descriptive title that captures your main idea</li>
          <li>• Break up long paragraphs for better readability</li>
          <li>• Add images to make your post more visually appealing</li>
          <li>• Share personal experiences or insights to engage readers</li>
        </ul>
      </div>
    </div>
  );
}

export default CreatePostPage; 