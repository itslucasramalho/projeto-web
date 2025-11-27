import {
  createForumTopic,
  getForumTopicById,
  listForumComments,
  listForumTopics,
  toggleForumCommentLike,
} from "@/lib/forum";

/* eslint-disable @typescript-eslint/no-explicit-any */

const createBuilder = (result: unknown = { data: [], error: null }) => {
  const builder: any = {
    select: jest.fn(() => builder),
    order: jest.fn(() => builder),
    range: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    in: jest.fn(() => builder),
    or: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    single: jest.fn(() => Promise.resolve(result)),
    maybeSingle: jest.fn(() => Promise.resolve(result)),
  };

  builder.then = (
    onFulfilled: (value: any) => void,
    onRejected?: (reason: any) => void
  ) => Promise.resolve(result).then(onFulfilled, onRejected);

  return builder;
};

const createSupabaseMock = (
  mapping: Record<
    string,
    ReturnType<typeof createBuilder> | ReturnType<typeof createBuilder>[]
  >
) => ({
  from: jest.fn((table: string) => {
    const entry = mapping[table];
    if (!entry) {
      throw new Error(`Unexpected table ${table}`);
    }
    if (Array.isArray(entry)) {
      const next = entry.shift();
      if (!next) {
        throw new Error(`No builder left for table ${table}`);
      }
      return next;
    }
    return entry;
  }),
});

describe("forum data helpers", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("listForumTopics applies filters and normalizes relations", async () => {
    const result = {
      data: [
        {
          id: "topic-1",
          title: "Mobilidade",
          user_id: "user-1",
          profiles: [
            {
              id: "user-1",
              display_name: "Ana",
              role: "admin",
            },
          ],
          laws: [
            {
              id: "law-1",
              title: "PL Mobilidade",
              number: "PL 123",
              status: "discussion",
            },
          ],
          forum_comments: [{ count: 3 }],
        },
      ],
      count: 5,
      error: null,
    };

    const builder = createBuilder(result);
    const supabase = createSupabaseMock({
      forum_topics: builder,
    });

    const response = await listForumTopics(supabase as any, {
      search: "mobilidade",
      page: 2,
    });

    expect(supabase.from).toHaveBeenCalledWith("forum_topics");
    expect(builder.range).toHaveBeenCalledWith(10, 19);
    expect(builder.or).toHaveBeenCalledWith(
      "title.ilike.%mobilidade%,content.ilike.%mobilidade%"
    );

    expect(response).toEqual({
      topics: [
        {
          ...result.data[0],
          author: result.data[0].profiles[0],
          law: result.data[0].laws[0],
          commentsCount: 3,
        },
      ],
      count: 5,
      page: 2,
      pageSize: 10,
    });
  });

  test("listForumTopics throws when Supabase returns error", async () => {
    const builder = createBuilder({ error: new Error("boom") });
    const supabase = createSupabaseMock({ forum_topics: builder });

    await expect(listForumTopics(supabase as any)).rejects.toThrow("boom");
  });

  test("getForumTopicById normalizes single topic", async () => {
    const data = {
      id: "topic-9",
      title: "Saúde",
      user_id: "user-9",
      profiles: { id: "user-9", display_name: "Bruno", role: "verified" },
      laws: { id: "law-9", title: "PL Saúde", number: null, status: "open" },
      forum_comments: [{ count: 0 }],
    };
    const builder = createBuilder({ data, error: null });
    builder.eq = jest.fn(() => builder);
    builder.maybeSingle = jest.fn(() => Promise.resolve({ data, error: null }));

    const supabase = createSupabaseMock({ forum_topics: builder });

    const topic = await getForumTopicById(supabase as any, "topic-9");

    expect(builder.eq).toHaveBeenCalledWith("id", "topic-9");
    expect(topic.author).toEqual(data.profiles);
    expect(topic.law).toEqual(data.laws);
    expect(topic.commentsCount).toBe(0);
  });

  test("listForumComments aggregates likes and likedByCurrentUser", async () => {
    const data = [
      {
        id: "comment-1",
        user_id: "user-1",
        profiles: [{ id: "user-1", display_name: "Ana", role: "citizen" }],
        forum_comment_likes: [
          { id: "like-1", user_id: "user-2" },
          { id: "like-2", user_id: "user-3" },
        ],
      },
    ];
    const builder = createBuilder({ data, error: null });
    builder.eq = jest.fn(() => builder);
    builder.order = jest.fn(() => builder);

    const supabase = createSupabaseMock({ forum_comments: builder });

    const comments = await listForumComments(supabase as any, "topic-1", {
      currentUserId: "user-2",
    });

    expect(builder.eq).toHaveBeenCalledWith("topic_id", "topic-1");
    expect(comments[0]).toMatchObject({
      id: "comment-1",
      likesCount: 2,
      likedByCurrentUser: true,
      author: data[0].profiles[0],
    });
  });

  test("createForumTopic forwards payload and returns id", async () => {
    const builder = createBuilder({ data: { id: "topic-123" }, error: null });
    builder.insert = jest.fn(() => builder);
    builder.select = jest.fn(() => builder);
    builder.single = jest.fn(() =>
      Promise.resolve({ data: { id: "topic-123" }, error: null })
    );

    const supabase = createSupabaseMock({ forum_topics: builder });

    const created = await createForumTopic(supabase as any, {
      title: "Novo tópico",
      content: "Descrição",
      userId: "user-1",
    });

    expect(builder.insert).toHaveBeenCalledWith({
      title: "Novo tópico",
      content: "Descrição",
      user_id: "user-1",
      law_id: null,
    });
    expect(created).toEqual({ id: "topic-123" });
  });

  test("toggleForumCommentLike removes existing like", async () => {
    const selectBuilder = createBuilder({
      data: { id: "like-1" },
      error: null,
    });
    selectBuilder.eq = jest.fn(() => selectBuilder);
    selectBuilder.maybeSingle = jest.fn(() =>
      Promise.resolve({ data: { id: "like-1" }, error: null })
    );

    const deleteBuilder = createBuilder({ error: null });
    deleteBuilder.delete = jest.fn(() => deleteBuilder);
    deleteBuilder.eq = jest.fn(() => deleteBuilder);

    const supabase = createSupabaseMock({
      forum_comment_likes: [selectBuilder, deleteBuilder],
    });

    const result = await toggleForumCommentLike(
      supabase as any,
      "comment-1",
      "user-1"
    );

    expect(deleteBuilder.delete).toHaveBeenCalled();
    expect(result).toEqual({ liked: false });
  });

  test("toggleForumCommentLike inserts when not liked yet", async () => {
    const selectBuilder = createBuilder({ data: null, error: null });
    selectBuilder.eq = jest.fn(() => selectBuilder);
    selectBuilder.maybeSingle = jest.fn(() =>
      Promise.resolve({ data: null, error: null })
    );

    const insertBuilder = createBuilder({ error: null });
    insertBuilder.insert = jest.fn(() => insertBuilder);

    const supabase = createSupabaseMock({
      forum_comment_likes: [selectBuilder, insertBuilder],
    });

    const result = await toggleForumCommentLike(
      supabase as any,
      "comment-2",
      "user-9"
    );

    expect(insertBuilder.insert).toHaveBeenCalledWith({
      comment_id: "comment-2",
      user_id: "user-9",
    });
    expect(result).toEqual({ liked: true });
  });
});
