export type AssistantPreferences = {
  personName: string;
  assistantName: string;
  theme: "classic" | "light";
  voiceInput: boolean;
  voiceOutput: boolean;
};

export const PREFERENCES_KEY = "jarvis.preferences.v1";
export const DEFAULT_PREFERENCES: AssistantPreferences = {
  personName: "",
  assistantName: "JARVIS",
  theme: "classic",
  voiceInput: true,
  voiceOutput: false,
};

export function readPreferences(): AssistantPreferences {
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || "{}") as Partial<AssistantPreferences>;
    return {
      personName: typeof parsed.personName === "string" ? parsed.personName.slice(0, 40) : DEFAULT_PREFERENCES.personName,
      assistantName: typeof parsed.assistantName === "string" ? parsed.assistantName.slice(0, 40) || DEFAULT_PREFERENCES.assistantName : DEFAULT_PREFERENCES.assistantName,
      theme: parsed.theme === "light" ? "light" : "classic",
      voiceInput: parsed.voiceInput !== false,
      voiceOutput: parsed.voiceOutput === true,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}
