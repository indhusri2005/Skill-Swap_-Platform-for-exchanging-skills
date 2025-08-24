# SkillSwap Connect Sphere

![Hero Image](public/placeholder.svg) <!-- If there's a actual hero image, update this -->

## Description

SkillSwap Connect Sphere is a peer-to-peer skill-sharing platform that connects learners and mentors worldwide. Users can exchange expertise by teaching skills they know and learning new ones in return. The platform facilitates skill swaps, mentor finding, and community-based learning in a supportive environment.

Key highlights:
- Browse diverse skill categories like Programming, Design, Business, Music, Languages, and more
- Find and connect with experienced mentors
- Manage your skill swaps and sessions
- Receive notifications for matches and updates
- Build your profile as both learner and teacher
- Start teaching your expertise to others

This project is built as a modern web application using React and various UI libraries to provide an intuitive user experience.

## Features

- **Home Dashboard**: Hero section with stats, featured mentors, skill categories, and how-it-works guide
- **Browse Skills**: Explore available skills with filters and search
- **Find Mentors**: Search and connect with potential mentors
- **My Swaps**: Manage ongoing and past skill exchanges
- **Notifications**: Real-time updates on matches and messages
- **User Profile**: Customize your skills, bio, and availability
- **Start Teaching**: Step-by-step setup for new mentors
- Responsive design for mobile and desktop
- Dark mode support
- Interactive UI components like cards, badges, and tooltips

## Tech Stack

- **Frontend**: React.js with TypeScript
- **UI Components**: Shadcn UI (based on Radix UI primitives)
- **Styling**: Tailwind CSS with custom gradients and animations
- **Routing**: React Router
- **State Management**: React Hooks and Tanstack Query
- **Build Tool**: Vite
- **Other Libraries**: Lucide Icons, Recharts for charts, React Hook Form, Zod for validation
- **Development Tools**: ESLint, Prettier (implied), PostCSS

## Prerequisites

- Node.js (v18 or later)
- npm (v8 or later) or Bun for package management

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/skillswap-connect-sphere.git
   cd skillswap-connect-sphere
   ```

2. Install frontend dependencies:
   ```
   npm install
   ```

3. Install backend dependencies:
   ```
   cd server
   npm install
   ```

4. Set up environment variables:
   ```
   cp server/.env.example server/.env
   ```
   
5. Seed the database with sample data:
   ```
   cd server
   npm run seed
   ```

## Usage

1. Start the backend server:
   ```
   cd server
   npm run dev
   ```

2. Start the frontend server (in a new terminal):
   ```
   npm run dev
   ```

3. Open http://localhost:8080 in your browser.

4. Login with sample credentials:
   - Email: `sarah.chen@example.com`
   - Password: `Password123`

5. For production build:
   ```
   npm run build
   ```
   Then serve the `dist` folder.

Available scripts:
- **Frontend**: `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`
- **Backend**: `npm run dev`, `npm run seed`, `npm start`

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Make your changes and commit: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

Please ensure your code follows the project's coding standards and passes linting.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. (Note: If no LICENSE file exists, consider adding one.)

## Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components from [Shadcn UI](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Inspired by peer-to-peer learning platforms

For more details on creating README files, check out guides like [How To Create a README](https://github.com/NotesFromBritt/READMEhowto) and [How to write a README](https://github.com/amarpan/how-to-write-a-README).

If you have questions, feel free to open an issue!
