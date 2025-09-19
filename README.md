# Medical Portal

A modern, full-stack medical portal application built with Next.js, TypeScript, and Tailwind CSS. This application provides a comprehensive platform for managing medical appointments, patient records, and healthcare services.

## Features

- 🔐 Secure authentication system with login and signup functionality
- 👨‍⚕️ Dedicated doctor dashboard for managing appointments and patient records
- 👥 Receptionist dashboard for handling patient registrations and scheduling
- 🎨 Modern UI with responsive design using Tailwind CSS
- 🔄 Real-time updates and notifications
- 📱 Mobile-friendly interface

## Tech Stack

- **Framework:** Next.js 15
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **Form Handling:** React Hook Form with Zod validation
- **State Management:** React Hooks
- **Real-time Features:** WebSocket
- **Database:** Upstash Redis
- **AI Integration:** OpenAI

## Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- pnpm (Package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/medical-portal.git
   cd medical-portal
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add the necessary environment variables:
   ```
   # Add your environment variables here
   ```

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
medical-portal/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── doctor-dashboard/  # Doctor interface
│   ├── receptionist-dashboard/ # Receptionist interface
│   ├── login/            # Authentication pages
│   └── signup/           # User registration
├── components/            # Reusable UI components
├── lib/                   # Utility functions and configurations
├── hooks/                 # Custom React hooks
├── public/               # Static assets
└── styles/               # Global styles
```

## Available Scripts

- `pnpm dev` - Start the development server
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint for code linting

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact me.
