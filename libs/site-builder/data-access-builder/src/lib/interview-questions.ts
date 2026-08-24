export interface InterviewQuestionConfig {
  id: string;
  label: string;
  type: 'text' | 'single' | 'multi';
  required: boolean;
  options?: string[];
  showWhen?: string;
}

export const INTERVIEW_QUESTIONS: InterviewQuestionConfig[] = [
  {
    id: 'q1',
    label: "What's your business name?",
    type: 'text',
    required: true,
  },
  {
    id: 'q2',
    label: 'What does your business sell?',
    type: 'text',
    required: true,
  },
  {
    id: 'q3',
    label: 'Who is your target audience?',
    type: 'text',
    required: true,
  },
  {
    id: 'q4',
    label: "What's your price range?",
    type: 'multi',
    options: ['Budget', 'Mid-range', 'Premium', 'Luxury'],
    required: true,
  },
  {
    id: 'q5',
    label: "How would you describe your brand's personality?",
    type: 'single',
    options: ['Energetic', 'Calm', 'Elegant', 'Playful'],
    required: true,
  },
  {
    id: 'q6',
    label: 'What type of products do you sell?',
    type: 'single',
    options: ['Physical', 'Digital', 'Both'],
    required: true,
  },
  {
    id: 'q7',
    label: 'Your preferred color?',
    type: 'single',
    options: [
      'Blue',
      'Red',
      'Green',
      'Yellow',
      'Purple',
      'Orange',
      'Pink',
      'Neutral',
      'Let AI choose',
    ],
    required: false,
    showWhen: 'logoUploaded',
  },
];
