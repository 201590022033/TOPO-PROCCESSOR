## Packages
framer-motion | Smooth page transitions and UI animations
date-fns | Formatting dates for the history table
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging Tailwind classes safely

## Notes
- Analysis creation is a two-step process: Upload file -> Create analysis record
- The 'results' JSONB field structure depends on Python output; displaying generically for now unless specific metrics (simK, etc.) are guaranteed
- Polling is required for the Analysis Details page to update status from 'processing' to 'completed'
