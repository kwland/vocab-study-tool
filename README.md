# Vocab Deck

A static vocabulary flashcard website for CSV-based studying. It runs locally by opening `index.html`, and it can be hosted on GitHub Pages without a build step.

## CSV Format

Use these columns:

```csv
term,definition,tier,example
Abate,To become less intense or widespread,Tier 1,The storm began to abate after midnight.
```

The importer also accepts `word` instead of `term`, `meaning` instead of `definition`, and `level` or `group` instead of `tier`.

## Features

- Import CSV vocabulary lists
- Flashcard front/back study mode
- Flip animation
- Rate words on a 1-5 mastery scale
- Browser-saved progress
- Saved dark/light theme toggle
- Learn mode with written answers, difficult multiple choice, and SAT-style blanks
- Learn setup screen that hides settings during active practice
- Switch Learn mode between answering with terms or definitions
- Sample a smaller set of cards for a focused Learn session
- Override a graded answer as correct or incorrect
- Manually rate specific library cards from mastery `1` to `5`
- `Learned today` counts correct Learn answers only, including correction overrides
- Success and miss animations during Learn mode
- Learn answers nudge mastery up or down automatically
- Spaced repetition that brings weak words back sooner
- Confusing-word pair hints
- Hard words only mode
- Daily goal tracking and review streaks
- Tier filter
- Shuffle
- Search
- Dashboard with mastery and tier breakdown
- Progress export

## GitHub Pages

Push these files to a GitHub repository, then enable Pages from the repository settings. Use the root folder as the Pages source.
