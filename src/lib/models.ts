export interface ChatModelOption {
  id: string;
  label: string;
  description: string;
  note?: string;
}

export interface ChatModelGroup {
  id: string;
  label: string;
  description: string;
  options: ChatModelOption[];
}

export const chatModelGroups: ChatModelGroup[] = [
  {
    id: "recommended",
    label: "Recommended",
    description: "Current GPT models from the OpenAI model catalog.",
    options: [
      {
        id: "gpt-5.4",
        label: "GPT-5.4",
        description: "Best intelligence at scale for professional and coding workflows."
      },
      {
        id: "gpt-5.4-pro",
        label: "GPT-5.4 Pro",
        description: "Highest quality GPT-5.4 variant for tougher reasoning tasks.",
        note: "Higher latency and cost."
      },
      {
        id: "gpt-5-mini",
        label: "GPT-5 Mini",
        description: "Fast, cost-sensitive GPT-5 option for everyday chat."
      },
      {
        id: "gpt-5-nano",
        label: "GPT-5 Nano",
        description: "Fastest and cheapest GPT-5 option for lightweight prompts."
      }
    ]
  },
  {
    id: "frontier",
    label: "Frontier GPT",
    description: "Current and previous flagship GPT text models.",
    options: [
      {
        id: "gpt-5.2",
        label: "GPT-5.2",
        description: "Previous frontier GPT model for professional work."
      },
      {
        id: "gpt-5.2-pro",
        label: "GPT-5.2 Pro",
        description: "Previous pro frontier variant focused on maximum quality.",
        note: "Higher latency and cost."
      },
      {
        id: "gpt-5.1",
        label: "GPT-5.1",
        description: "Strong coding and agentic GPT model with configurable reasoning."
      },
      {
        id: "gpt-5",
        label: "GPT-5",
        description: "Previous GPT-5 reasoning model for coding and agentic tasks."
      }
    ]
  },
  {
    id: "coding",
    label: "Coding",
    description: "GPT variants optimized for software engineering work.",
    options: [
      {
        id: "gpt-5.3-codex",
        label: "GPT-5.3 Codex",
        description: "Most capable long-horizon GPT coding model in the catalog."
      },
      {
        id: "gpt-5.2-codex",
        label: "GPT-5.2 Codex",
        description: "High-end agentic coding model for longer implementation tasks."
      },
      {
        id: "gpt-5-codex",
        label: "GPT-5 Codex",
        description: "GPT-5 variant optimized for agentic coding workflows."
      },
      {
        id: "gpt-5.1-codex",
        label: "GPT-5.1 Codex",
        description: "GPT-5.1 variant built for coding-heavy agent runs."
      },
      {
        id: "gpt-5.1-codex-max",
        label: "GPT-5.1 Codex Max",
        description: "Long-running coding variant tuned for extended tasks."
      },
      {
        id: "gpt-5.1-codex-mini",
        label: "GPT-5.1 Codex Mini",
        description: "Cheaper coding-focused alternative for smaller tasks."
      }
    ]
  },
  {
    id: "classic",
    label: "Classic GPT",
    description: "Reliable non-reasoning and multimodal GPT models.",
    options: [
      {
        id: "gpt-4.1",
        label: "GPT-4.1",
        description: "Strong non-reasoning GPT model for general text and tool use."
      },
      {
        id: "gpt-4.1-mini",
        label: "GPT-4.1 Mini",
        description: "Smaller, faster GPT-4.1 option."
      },
      {
        id: "gpt-4.1-nano",
        label: "GPT-4.1 Nano",
        description: "Fastest and cheapest GPT-4.1 variant."
      },
      {
        id: "gpt-4o",
        label: "GPT-4o",
        description: "Flexible multimodal GPT model for chat and vision."
      },
      {
        id: "gpt-4o-mini",
        label: "GPT-4o Mini",
        description: "Affordable multimodal GPT model for focused tasks."
      }
    ]
  },
  {
    id: "legacy",
    label: "Legacy",
    description: "Older GPT models that can still be useful for compatibility.",
    options: [
      {
        id: "gpt-3.5-turbo",
        label: "GPT-3.5 Turbo",
        description: "Legacy GPT model for cheaper chat and compatibility."
      }
    ]
  }
];

export const chatModelOptions = chatModelGroups.flatMap((group) => group.options);

export function getChatModelOption(modelId: string) {
  return chatModelOptions.find((option) => option.id === modelId) ?? null;
}
