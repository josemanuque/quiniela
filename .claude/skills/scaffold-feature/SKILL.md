---
name: scaffold-feature
description: Use when the user requests a brand new domain feature module (e.g., groups, predictions, matches, leaderboard).
---

# /scaffold-feature Execution Checklist

1. **Directory Setup**: Create a new directory under `src/features/[feature-name]/`. Inside it, generate exactly five subdirectories: `components/`, `hooks/`, `services/`, `types/`, and `utils/`.
2. **Styling Module**: Inside the `components/` directory, create a base `styles.module.scss` file for any feature-specific Sass modular layouts.
3. **Service Layer Scaffolding**: Create a base placeholder service `src/features/[feature-name]/services/[featureName]Service.ts`. Ensure it is a pure TypeScript module containing typed shell methods.
4. **Enforce Abstraction**: Ensure absolutely no file in this new directory imports `supabaseClient` directly. All database access must be hidden inside the feature's service layer.
5. **Compilation Check**: Run a terminal check using `npx tsc --noEmit` immediately after scaffolding to verify there are no broken relative imports, syntax errors, or strict TypeScript type violations.