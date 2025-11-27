import { ensurePropositionSummary } from "@/lib/proposition-summary";
import { summarizeLongText } from "@/lib/openai";
import { createAdminClient } from "@/lib/supabase/admin";

jest.mock("@/lib/supabase/admin", () => ({
  createAdminClient: jest.fn(),
}));

jest.mock("@/lib/openai", () => ({
  summarizeLongText: jest.fn(),
}));

const mockedCreateAdminClient = createAdminClient as jest.MockedFunction<
  typeof createAdminClient
>;
const mockedSummarizeLongText = summarizeLongText as jest.MockedFunction<
  typeof summarizeLongText
>;

describe("ensurePropositionSummary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns cached summary without calling OpenAI", async () => {
    mockedCreateAdminClient.mockReturnValueOnce(
      createMetadataClient({
        ai_summary: "Resumo salvo",
        ai_summary_updated_at: "2024-10-10T00:00:00.000Z",
      }),
    );

    const result = await ensurePropositionSummary("prop-1");

    expect(result).toEqual({
      status: "already_exists",
      summary: "Resumo salvo",
      updatedAt: "2024-10-10T00:00:00.000Z",
    });
    expect(mockedSummarizeLongText).not.toHaveBeenCalled();
  });

  test("generates summary only once when called concurrently", async () => {
    mockedCreateAdminClient
      .mockReturnValueOnce(
        createMetadataClient({
          ai_summary: null,
          ai_summary_updated_at: null,
        }),
      )
      .mockReturnValueOnce(
        createMetadataClient({
          ai_summary: null,
          ai_summary_updated_at: null,
        }),
      )
      .mockReturnValueOnce(createGenerationClient());

    mockedSummarizeLongText.mockResolvedValue("Texto final");

    const [first, second] = await Promise.all([
      ensurePropositionSummary("prop-2"),
      ensurePropositionSummary("prop-2"),
    ]);

    expect(mockedSummarizeLongText).toHaveBeenCalledTimes(1);
    expect(first.status).toBe("generated");
    expect(second.status).toBe("generated");
    expect(first.summary).toBe("Texto final");
    expect(second.summary).toBe("Texto final");
  });
});

function createMetadataClient(result: {
  ai_summary: string | null;
  ai_summary_updated_at: string | null;
}) {
  const maybeSingle = jest.fn().mockResolvedValue({
    data: result,
    error: null,
  });
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select });
  return { from } as unknown as ReturnType<typeof createAdminClient>;
}

function createGenerationClient() {
  const maybeSingle = jest.fn().mockResolvedValue({
    data: {
      id: "prop-2",
      title: "Proposição teste",
      ementa: "Ementa oficial",
      ementa_detalhada: "Detalhes adicionais",
      source_url: "https://camara.example/prop-2",
      ai_summary: null,
      ai_summary_updated_at: null,
    },
    error: null,
  });
  const selectEq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq: selectEq });

  const updateEq = jest.fn().mockResolvedValue({ error: null });
  const update = jest.fn().mockReturnValue({ eq: updateEq });

  const from = jest.fn().mockReturnValue({ select, update });

  return { from } as unknown as ReturnType<typeof createAdminClient>;
}

