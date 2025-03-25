# Vite-React-Appwrite Template

This repository serves as a template for kickstarting projects using Vite, React, React Router DOM, Tailwind CSS and Shadcn. The template includes pre-configured routes and basic pages to help you quickly set up and start building your application.

## Features

- **Vite**: Lightning-fast development environment.
- **React**: Modern library for building user interfaces.
- **React Router DOM**: Pre-configured routes for navigation.
- **Tailwind CSS**: Utility-first CSS framework for rapid styling.
- **Shadcn**: Beautifully designed components built with Radix UI and Tailwind CSS
- **Appwrite**: Open-source backend for authentication, database, file storage, and more.

## Getting Started

### Prerequisites

Make sure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (version 16 or later recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. Create a new folder for your project and navigate into it (Replace <Your-Project-Name> with the name of your actual project):

   ```bash
   mkdir <Your-Project-Name> && cd <Your-Project-Name>
   ```

2. Clone the repository:

   ```bash
   git clone https://github.com/ARK018/React-Appwrite-Template.git ./
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

   or

   ```bash
   npm i
   ```

4. Remove the Existing Git Repository if you want to create a new one. (Optional):

   ```bash
   Remove-Item -Recurse -Force .git
   ```

5. Set up Appwrite:

   Follow the Appwrite installation guide to set up your Appwrite server or use Appwrite Cloud.
   Create a new project in your Appwrite dashboard.
   Copy the Project ID & Endpoint.

6. Configure Appwrite in your project:

   Open .env and add your Appwrite Project ID & Endpoint:

7. Start the development server:

   ```bash
   npm run dev
   ```

8. Open your browser and navigate to `http://localhost:5173` to see the application in action.

### Available Scripts

- **`npm run dev`**: Start the development server.
- **`npm run build`**: Build the application for production.
- **`npm run preview`**: Preview the production build.

## Routing

The project uses `React Router DOM` for routing. You can easily add new routes by creating new components in the `pages` folder and updating the `App.jsx` file.

### Example Routes

- **Home Page**: `/`
- **SignIn Page**: `/signin`

## Tailwind CSS

Tailwind CSS is pre-configured in the project. You can start using utility classes directly in your components. The `index.css` file includes the necessary setup.

## Appwrite Features

This template includes basic Appwrite setup for the following functionalities:

- **Authentication**: Manage user sign-ups, logins, and sessions.
- **Database**: Store structured data using Appwrite's NoSQL databases.
- **File Storage**: Upload and manage user files.

### Extending Appwrite

You can extend Appwrite functionalities as per your project requirements. Refer to the [Appwrite documentation](https://appwrite.io/docs) for detailed guidance.
