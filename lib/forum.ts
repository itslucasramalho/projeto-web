import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database.types";

type TypedClient = SupabaseClient<Database>;

type ProfileRow = Pick<Tables<"profiles">, "id" | "display_name" | "role">;
type LawRow = Pick<Tables<"laws">, "id" | "title" | "number" | "status">;

const normalizeRelation = <T>(relation?: T | T[] | null): T | null => {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] ?? null : relation;
};

export type ForumAuthor = ProfileRow | null;

export type ForumTopicWithMeta = Tables<"forum_topics"> & {
  author: ForumAuthor;
  law: LawRow | null;
  commentsCount: number;
};

type ForumTopicRow = Tables<"forum_topics"> & {
  profiles: ForumAuthor | ForumAuthor[];
  laws: LawRow | LawRow[] | null;
  forum_comments: { count: number | null }[] | null;
};

export type ForumTopicFilters = {
  search?: string;
  lawId?: string;
  page?: number;
  pageSize?: number;
};

const TOPICS_DEFAULT_PAGE_SIZE = 10;

export async function listForumTopics(
  supabase: TypedClient,
  filters: ForumTopicFilters = {}
) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? TOPICS_DEFAULT_PAGE_SIZE;
  const rangeStart = (page - 1) * pageSize;
  const rangeEnd = rangeStart + pageSize - 1;

  let query = supabase
    .from("forum_topics")
    .select(
      `
        id,
        title,
        content,
        status,
        is_pinned,
        created_at,
        updated_at,
        law_id,
        user_id,
        profiles:profiles (
          id,
          display_name,
          role
        ),
        laws:laws (
          id,
          title,
          number,
          status
        ),
        forum_comments:forum_comments(count)
      `,
      { count: "exact" }
    )
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(rangeStart, rangeEnd);

  if (filters.lawId) {
    query = query.eq("law_id", filters.lawId);
  }

  if (filters.search) {
    const like = `%${filters.search.trim()}%`;
    query = query.or(`title.ilike.${like},content.ilike.${like}`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  const topics = (data ?? []).map((topic) => {
    const row = topic as ForumTopicRow;
    const author = normalizeRelation(row.profiles);
    const law = normalizeRelation(row.laws);
    const formatted: ForumTopicWithMeta = {
      ...row,
      author,
      law,
      commentsCount: row.forum_comments?.[0]?.count ?? 0,
    };
    return formatted;
  });

  return {
    topics,
    count: count ?? topics.length,
    page,
    pageSize,
  };
}

export async function getForumTopicById(
  supabase: TypedClient,
  topicId: string
) {
  const { data, error } = await supabase
    .from("forum_topics")
    .select(
      `
        id,
        title,
        content,
        status,
        is_pinned,
        created_at,
        updated_at,
        law_id,
        user_id,
        profiles:profiles (
          id,
          display_name,
          role
        ),
        laws:laws (
          id,
          title,
          number,
          status
        ),
        forum_comments:forum_comments(count)
      `
    )
    .eq("id", topicId)
    .maybeSingle<ForumTopicRow>();

  if (error || !data) {
    throw error ?? new Error("Tópico não encontrado");
  }

  const formatted: ForumTopicWithMeta = {
    ...data,
    author: normalizeRelation(data.profiles),
    law: normalizeRelation(data.laws),
    commentsCount: data.forum_comments?.[0]?.count ?? 0,
  };

  return formatted;
}

export type ForumCommentWithMeta = Tables<"forum_comments"> & {
  author: ForumAuthor;
  likesCount: number;
  likedByCurrentUser: boolean;
};

type ForumCommentRow = Tables<"forum_comments"> & {
  profiles: ForumAuthor | ForumAuthor[];
  forum_comment_likes: { id: string; user_id: string }[] | null;
};

export async function listForumComments(
  supabase: TypedClient,
  topicId: string,
  options: { currentUserId?: string } = {}
) {
  const { data, error } = await supabase
    .from("forum_comments")
    .select(
      `
        id,
        content,
        created_at,
        updated_at,
        topic_id,
        user_id,
        profiles:profiles (
          id,
          display_name,
          role
        ),
        forum_comment_likes (
          id,
          user_id
        )
      `
    )
    .eq("topic_id", topicId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((comment) => {
    const row = comment as ForumCommentRow;
    const likes = row.forum_comment_likes ?? [];
    const formatted: ForumCommentWithMeta = {
      ...row,
      author: normalizeRelation(row.profiles),
      likesCount: likes.length,
      likedByCurrentUser: Boolean(
        options.currentUserId &&
          likes.some((like) => like.user_id === options.currentUserId)
      ),
    };
    return formatted;
  });
}

export type CreateForumTopicPayload = {
  title: string;
  content: string;
  userId: string;
  lawId?: string | null;
};

export async function createForumTopic(
  supabase: TypedClient,
  payload: CreateForumTopicPayload
) {
  const { data, error } = await supabase
    .from("forum_topics")
    .insert({
      title: payload.title,
      content: payload.content,
      user_id: payload.userId,
      law_id: payload.lawId ?? null,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export type CreateForumCommentPayload = {
  topicId: string;
  content: string;
  userId: string;
};

export async function createForumComment(
  supabase: TypedClient,
  payload: CreateForumCommentPayload
) {
  const { data, error } = await supabase
    .from("forum_comments")
    .insert({
      topic_id: payload.topicId,
      content: payload.content,
      user_id: payload.userId,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function toggleForumCommentLike(
  supabase: TypedClient,
  commentId: string,
  userId: string
) {
  const { data: existing } = await supabase
    .from("forum_comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("forum_comment_likes")
      .delete()
      .eq("id", existing.id);

    if (error) {
      throw error;
    }

    return { liked: false };
  }

  const { error } = await supabase.from("forum_comment_likes").insert({
    comment_id: commentId,
    user_id: userId,
  });

  if (error) {
    throw error;
  }

  return { liked: true };
}
