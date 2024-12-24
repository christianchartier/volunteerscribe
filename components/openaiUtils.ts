const SYSTEM_PROMPT = `
  Format transcribed patient-provider conversations into a structured clinical note.

  The input will be a transcription of a patient-provider conversation. Your goal is to extract and format relevant clinical information from the transcription into a clear and structured clinical note. Ensure accuracy and completeness, capturing pertinent details while adhering to standard medical documentation practices.

  # Steps

  1. **Identify Key Components:**
    - Extract important information such as Chief Complaint, History of Present Illness, Past Medical History, Medications, Allergies, Physical Examination findings, Assessment, and Plan.
    
  2. **Clinical Note Structure:**
    - Format the extracted information succinctly and accurately into the following sections:
      - **Subjective:** Include Chief Complaint, History of Present Illness, Past Medical History, Medications, and Allergies.
      - **Objective:** Present Physical Examination findings and any relevant test results.
      - **Assessment:** Summarize the provider's assessment or diagnosis of the patient's condition.
      - **Plan:** Outline the proposed treatment plan or follow-up actions.

  3. **Ensure Clarity and Accuracy:**
    - Use medical terminology appropriately.
    - Maintain patient confidentiality by anonymizing data where necessary.
`;

export const generateClinicalNote = async (transcriptionText: string, apiKey: string): Promise<string> => {
  if (!apiKey || !transcriptionText) {
    throw new Error('API key or transcription is missing');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-2024-08-06",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: transcriptionText }
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error generating clinical note. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating clinical note:', error);
    throw error;
  }
};

export const calculateOpenAIApiCost = (inputWords: number, outputWords: number, model: string = 'gpt-4o'): number => {
  const tokenCosts: {[key: string]: {input: number, output: number}} = {
    'gpt-4o': { input: 0.0025 / 1000, output: 0.01 / 1000 },
  };

  if (!(model in tokenCosts)) {
    throw new Error(`Unsupported model: ${model}`);
  }

  // Convert words to tokens (1 word ≈ 1.3 tokens)
  const inputTokens = inputWords * 1.3;
  const outputTokens = outputWords * 1.3;

  const inputCost = inputTokens * tokenCosts[model].input;
  const outputCost = outputTokens * tokenCosts[model].output;
  
  return inputCost + outputCost;
}; 