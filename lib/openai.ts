import OpenAI from "openai";

const DEFAULT_MODEL = process.env.OPENAI_SUMMARY_MODEL ?? "gpt-4o-mini";
const DEFAULT_CHUNK_SIZE = Number(
  process.env.OPENAI_CHUNK_SIZE ?? 3500,
) /* characters */;

export type ChatMessage = OpenAI.ChatCompletionMessageParam;

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY não configurada. Defina a variável de ambiente antes de chamar a IA.",
    );
  }

  return new OpenAI({ apiKey });
}

export async function chatCompletion(
  messages: ChatMessage[],
  {
    temperature = 0,
    model = DEFAULT_MODEL,
  }: { temperature?: number; model?: string } = {},
) {
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model,
    temperature,
    messages,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Resposta da OpenAI veio vazia.");
  }

  return content.trim();
}

export function normalizeText(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

export function chunkText(
  text: string,
  chunkSize = DEFAULT_CHUNK_SIZE,
  delimiter = "\n\n",
) {
  const chunks: string[] = [];
  const paragraphs = text.split(delimiter).map((paragraph) => paragraph.trim());
  let current = "";

  paragraphs.forEach((paragraph) => {
    if (!paragraph) {
      return;
    }

    if ((current + delimiter + paragraph).length <= chunkSize) {
      current = current ? `${current}${delimiter}${paragraph}` : paragraph;
      return;
    }

    if (current) {
      chunks.push(current);
    }

    if (paragraph.length > chunkSize) {
      for (let i = 0; i < paragraph.length; i += chunkSize) {
        chunks.push(paragraph.slice(i, i + chunkSize));
      }
      current = "";
    } else {
      current = paragraph;
    }
  });

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

export async function summarizeLongText({
  text,
  detail = 0.5,
  systemPrompt,
  chunkInstruction = "Resuma o texto a seguir em linguagem simples:",
  combineInstruction = "Combine os resumos anteriores em um texto único e coerente.",
  model = DEFAULT_MODEL,
}: {
  text: string;
  detail?: number;
  systemPrompt: string;
  chunkInstruction?: string;
  combineInstruction?: string;
  model?: string;
}) {
  const sanitized = text.trim();
  if (!sanitized) {
    return "Não há conteúdo suficiente para resumir.";
  }

  const baseChunkSize = Math.max(
    1800,
    Math.min(6000, Math.round(DEFAULT_CHUNK_SIZE * (0.75 + detail))),
  );

  const chunks = chunkText(sanitized, baseChunkSize);

  if (chunks.length === 1) {
    return chatCompletion(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `${chunkInstruction}\n\n${chunks[0]}`,
        },
      ],
      { model },
    );
  }

  const partialSummaries: string[] = [];

  for (const [index, chunk] of chunks.entries()) {
    const summary = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `${chunkInstruction}\n\nTrecho ${
            index + 1
          } de ${chunks.length}:\n\n${chunk}`,
        },
      ],
      { model },
    );
    partialSummaries.push(summary);
  }

  const combined = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `${combineInstruction}\n\n${partialSummaries
          .map((summary, index) => `Resumo ${index + 1}: ${summary}`)
          .join("\n\n")}`,
      },
    ],
    { model },
  );

  return combined;
}

