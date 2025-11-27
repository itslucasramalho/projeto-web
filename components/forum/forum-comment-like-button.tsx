"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type ForumCommentLikeButtonProps = {
  commentId: string;
  currentUserId: string | null;
  initialLiked: boolean;
  initialLikesCount: number;
};

export function ForumCommentLikeButton({
  commentId,
  currentUserId,
  initialLiked,
  initialLikesCount,
}: ForumCommentLikeButtonProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (!currentUserId) {
      router.push("/auth/login");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    if (liked) {
      const { error } = await supabase
        .from("forum_comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", currentUserId);

      if (!error) {
        setLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      }
    } else {
      const { error } = await supabase.from("forum_comment_likes").insert({
        comment_id: commentId,
        user_id: currentUserId,
      });

      if (!error) {
        setLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    }

    setIsLoading(false);
    router.refresh();
  };

  return (
    <Button
      type="button"
      variant={liked ? "default" : "ghost"}
      size="sm"
      className="gap-2"
      onClick={handleToggle}
      disabled={isLoading}
    >
      <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
      {likesCount}
    </Button>
  );
}

