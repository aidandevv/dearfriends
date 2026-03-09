export type LetterTemplate = {
  id: string
  name: string
  defaultBody: string
  accentColor: string
}

export const LETTER_TEMPLATES: LetterTemplate[] = [
  {
    id: 'holiday',
    name: 'Holiday',
    accentColor: '#8B4513',
    defaultBody: `# Happy Holidays, {{first_name}}!

What a year it's been. I've been thinking about you and wanted to take a moment to send some warmth your way.

Wishing you and yours a season full of joy, rest, and good company.

With love,
[Your name]`,
  },
  {
    id: 'summer',
    name: 'Summer',
    accentColor: '#D2691E',
    defaultBody: `# Hey {{first_name}}!

Summer's here and I wanted to say hi. Hope life is treating you well and you're getting some sun.

Thinking of you from afar. Let's catch up soon.

Warmly,
[Your name]`,
  },
  {
    id: 'birthday',
    name: 'Birthday',
    accentColor: '#9B59B6',
    defaultBody: `# Happy Birthday, {{first_name}}!

Just wanted to take a moment to celebrate you today. Hope this year brings you everything you've been hoping for.

Cheers to you!
[Your name]`,
  },
  {
    id: 'evergreen',
    name: 'Evergreen',
    accentColor: '#2E8B57',
    defaultBody: `# Hi {{first_name}},

I've been meaning to write for a while. Life gets busy, but I didn't want too much time to pass without reaching out.

Hope all is well on your end. Sending good thoughts your way.

Take care,
[Your name]`,
  },
]
