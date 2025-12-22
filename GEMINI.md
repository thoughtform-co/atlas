# GEMINI.md

## Project Overview

This project, "Atlas Eidolon," is a Next.js application that serves as a visual bestiary for a fictional universe called "Thoughtform." It's a sophisticated tool for cataloging and exploring "Latent Space Denizens," which are entities that exist in a semantic manifold.

The application is built with a strong emphasis on a unique design philosophy, combining a "Research Station" aesthetic with a deep, narrative-driven world. It uses a rich data model to represent the denizens and their metaphysical properties, and it integrates with several AI services to provide features like automated entity analysis and semantic search.

**Key Technologies:**

*   **Framework:** Next.js 16 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS v4 with a custom design token system
*   **Database:** Supabase (PostgreSQL) with `pgvector` for semantic search
*   **AI Services:**
    *   **Google Gemini:** For image and video analysis to extract entity properties.
    *   **Anthropic Claude:** To power the "Archivist," an AI assistant for cataloging.
    *   **Voyage AI:** For text embeddings to enable semantic search.
*   **Animation:** Canvas API for particle effects and data visualizations.

**Architecture:**

The application follows a modern, full-stack architecture with a Next.js frontend and a backend powered by Next.js API Routes and Supabase. The frontend is built with React 19 and uses a component-based approach. The backend handles data fetching, AI service integration, and authentication.

A key architectural feature is the use of a fallback mechanism to static data, ensuring the application remains functional even if the database is unavailable.

## Building and Running

### Prerequisites

*   Node.js 18+
*   npm or yarn

### Installation

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Set up environment variables:**

    Copy the `.env.example` file to a new file named `.env.local`:

    ```bash
    cp .env.example .env.local
    ```

    You will need to populate this file with your credentials for the following services:

    *   **Supabase:**
        *   `NEXT_PUBLIC_SUPABASE_URL`
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        *   `SUPABASE_SERVICE_ROLE_KEY`
    *   **AI Services:**
        *   `GOOGLE_GEMINI_API_KEY`
        *   `ANTHROPIC_API_KEY`
        *   `VOYAGE_API_KEY`
    *   **Replicate (for video generation):**
        *   `REPLICATE_API_TOKEN`

    For detailed instructions on setting up the Gemini API key, refer to the `GEMINI_API_KEY_SETUP.md` file.

3.  **Generate database types:**

    This project uses a script to generate TypeScript types from the Supabase schema. Run the following command to generate the types:

    ```bash
    npm run types:generate
    ```

    This will create the `src/lib/database.types.ts` file, which is essential for type-safe database interactions.

### Running the Application

Once you have installed the dependencies and configured the environment variables, you can run the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

To create a production build, run the following command:

```bash
npm run build
```

This will generate an optimized version of the application in the `.next` directory.

### Other Scripts

*   `npm start`: Starts the application in production mode.
*   `npm run lint`: Lints the codebase using ESLint.

## Development Conventions

This project follows a set of well-defined development conventions, which are essential for maintaining the quality and consistency of the codebase.

**Coding Style:**

*   **TypeScript:** The project uses TypeScript for type safety. Adhere to the types defined in `src/lib/types.ts` and `src/lib/database.types.ts`.
*   **ESLint:** The project uses ESLint to enforce a consistent coding style. Run `npm run lint` to check for any linting errors.
*   **Naming Conventions:** Follow the naming conventions used in the existing codebase.

**Design System:**

The project has a unique design system based on a "Research Station" aesthetic. Key elements of the design system include:

*   **Colors:** A specific color palette is defined in `DESIGN_PHILOSOPHY.md`. Use these colors to maintain a consistent look and feel.
*   **Typography:** The project uses PT Mono and IBM Plex Sans for fonts.
*   **Spacing:** An 8px grid-based spacing system is used throughout the application.

**AI Integration:**

The project makes extensive use of AI services. When working with AI-related features, refer to the `SYSTEM_PROMPTS_GUIDE.md` file for detailed instructions on how to structure and use the AI prompts.

**Database:**

The project uses Supabase for the database. When interacting with the database, use the Supabase client and the generated TypeScript types to ensure type safety.

**Fallback to Static Data:**

The application has a fallback mechanism to static data, which is used when the database is unavailable. This is an important feature to maintain, so be sure to test your changes with and without a database connection.
