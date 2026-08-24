import { decodeAnswer, encodeAnswer, isAnswered } from './answer-codec';
import { InterviewQuestionConfig } from '@invento/site-builder-data-access-builder';

const textQuestion: InterviewQuestionConfig = {
  id: 'q1',
  label: 'Business name',
  type: 'text',
  required: true,
};

const singleQuestion: InterviewQuestionConfig = {
  id: 'q5',
  label: 'Brand personality',
  type: 'single',
  required: true,
  options: ['Energetic', 'Calm', 'Elegant', 'Playful'],
};

const multiQuestion: InterviewQuestionConfig = {
  id: 'q4',
  label: 'Price range',
  type: 'multi',
  required: true,
  options: ['Budget', 'Mid-range', 'Premium', 'Luxury'],
};

const optionalSingle: InterviewQuestionConfig = {
  id: 'q7',
  label: 'Preferred colour',
  type: 'single',
  required: false,
  options: ['Blue', 'Red', 'Let AI choose'],
};

describe('decodeAnswer', () => {
  it('returns an empty value for null/undefined', () => {
    expect(decodeAnswer(textQuestion, null)).toBe('');
    expect(decodeAnswer(singleQuestion, undefined)).toBe('');
    expect(decodeAnswer(multiQuestion, null)).toEqual([]);
  });

  it('resolves a numeric index to its option label', () => {
    expect(decodeAnswer(singleQuestion, 2)).toBe('Elegant');
  });

  it('resolves an index sent as a string', () => {
    expect(decodeAnswer(singleQuestion, '1')).toBe('Calm');
  });

  it('matches an exact label case-insensitively', () => {
    expect(decodeAnswer(singleQuestion, 'playful')).toBe('Playful');
  });

  it('falls back to a fuzzy label match', () => {
    expect(decodeAnswer(multiQuestion, 'mid-range pricing')).toEqual(['Mid-range']);
  });

  it('keeps an unmatched value rather than dropping the prefill', () => {
    expect(decodeAnswer(singleQuestion, 'Whimsical')).toBe('Whimsical');
  });

  it('splits a comma-separated string into multi options', () => {
    expect(decodeAnswer(multiQuestion, 'Budget, Luxury')).toEqual(['Budget', 'Luxury']);
  });

  it('resolves an array of indices for multi questions', () => {
    expect(decodeAnswer(multiQuestion, [0, 3])).toEqual(['Budget', 'Luxury']);
  });

  it('passes text answers through unchanged', () => {
    expect(decodeAnswer(textQuestion, 'Acme Co')).toBe('Acme Co');
  });
});

describe('encodeAnswer', () => {
  it('trims text answers and nulls out empties', () => {
    expect(encodeAnswer(textQuestion, '  Acme  ')).toBe('Acme');
    expect(encodeAnswer(textQuestion, '   ')).toBeNull();
  });

  it('converts a single-choice label to its index', () => {
    expect(encodeAnswer(singleQuestion, 'Elegant')).toBe(2);
  });

  it('treats the AI-choice sentinel as no answer', () => {
    expect(encodeAnswer(optionalSingle, 'Let AI choose')).toBeNull();
  });

  it('converts multi labels to indices', () => {
    expect(encodeAnswer(multiQuestion, ['Budget', 'Luxury'])).toEqual([0, 3]);
  });

  it('nulls out an empty multi selection', () => {
    expect(encodeAnswer(multiQuestion, [])).toBeNull();
  });

  it('drops labels that match no option', () => {
    expect(encodeAnswer(multiQuestion, ['Budget', 'Nonsense'])).toEqual([0]);
  });

  it('round-trips a decoded prefill back to the same index', () => {
    const decoded = decodeAnswer(singleQuestion, 3);
    expect(encodeAnswer(singleQuestion, decoded)).toBe(3);
  });
});

describe('isAnswered', () => {
  it('requires a non-empty array for multi questions', () => {
    expect(isAnswered(multiQuestion, [])).toBe(false);
    expect(isAnswered(multiQuestion, ['Budget'])).toBe(true);
  });

  it('rejects blank and missing scalar answers', () => {
    expect(isAnswered(textQuestion, '   ')).toBe(false);
    expect(isAnswered(textQuestion, null)).toBe(false);
    expect(isAnswered(textQuestion, 'Acme')).toBe(true);
  });
});
