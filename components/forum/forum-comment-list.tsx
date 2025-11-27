import { ForumCommentWithMeta } from "@/lib/forum";
import { ForumCommentLikeButton } from "@/components/forum/forum-comment-like-button";
import { UserAvatar } from "@/components/user-avatar";
import { VerifiedBadge } from "@/components/verified-badge";

type ForumCommentListProps = {
  comments: ForumCommentWithMeta[];
  currentUserId: string | null;
};

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function ForumCommentList({
  comments,
  currentUserId,
}: ForumCommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        Nenhum comentário ainda. Seja a primeira pessoa a contribuir.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const authorName = comment.author?.display_name ?? "Cidadão";
        const isVerified = comment.author?.role === "verified";
        const createdAt = dateTimeFormatter.format(new Date(comment.created_at));

        return (
          <article key={comment.id} className="rounded-md border p-4">
            <div className="flex items-start gap-3">
              <UserAvatar
                name={authorName}
                identifier={comment.author?.id ?? comment.user_id}
                size="sm"
              />
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {authorName}
                  </span>
                  {isVerified && (
                    <VerifiedBadge label="Verificado" className="text-[11px]" />
                  )}
                  <span className="text-xs text-muted-foreground">{createdAt}</span>
                </div>
                <p className="text-sm leading-relaxed text-foreground">
                  {comment.content}
                </p>
                <ForumCommentLikeButton
                  commentId={comment.id}
                  currentUserId={currentUserId}
                  initialLiked={comment.likedByCurrentUser}
                  initialLikesCount={comment.likesCount}
                />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

