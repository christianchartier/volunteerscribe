# Volunteer Medical Scribe

This repository contains the source code for the Volunteer Medical Scribe, a Next.js-based app for transcribing and formatting medical notes using AI.

## Project Structure

The repository is structured as follows:

```
├── .eslintrc.json
├── .gitignore
├── README.md
├── app
│   ├── favicon.ico
│   ├── fonts
│   │   ├── GeistMonoVF.woff
│   │   └── GeistVF.woff
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   └── ui
│       ├── button.tsx
│       ├── input.tsx
│       └── textarea.tsx
├── lib
│   └── utils.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── public
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── tailwind.config.ts
└── tsconfig.json
```

## Getting Started

To get started with development:

1. Clone the repository:
```bash
git clone https://github.com/christianchartier/volunteerscribe.git
cd volunteerscribe
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

Open http://localhost:3000 to view the app in the browser.

## App Overview

This project is built using Next.js, and leverages the following tools:

* Tailwind CSS for styling
* Lucide-React for icons
* OpenAI API for AI transcription and note generation

## Folder Structure

* **app/**: Contains the main pages and layout components
* **components/ui/**: Reusable UI components like buttons, inputs, and text areas
* **lib/**: Utility functions, such as cn for class name merging
* **public/**: Static assets like icons and images
* **next.config.ts**: Configuration for Next.js
* **tailwind.config.ts**: Tailwind CSS configuration

## Features

* **AI Transcription**: Record audio or upload an audio file, and the app uses OpenAI's Whisper model to transcribe the conversation
* **Medical Note Generation**: Automatically formats the transcription into a structured clinical note
* **User-friendly UI**: Drag-and-drop file upload, visual feedback for actions like recording, and more

## Deployment

The app is designed to be deployed using Vercel, the platform that powers Next.js.

To deploy:
1. Go to Vercel and sign in
2. Import this project from GitHub
3. Set up environment variables like your OpenAI API key
4. Deploy!

## Environment Variables

To use the OpenAI API, you will need to set up the following environment variables in a `.env` file:

```
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or fixes.

---

Built with ❤️ by Christian Chartier
