# Relnet: Friendship Connection Visualizer

A dynamic web application for visualizing and managing a friendship network. This project uses React Flow to display interactive connection graphs between friends, and includes a backend server built with Node.js, TypeScript, Express, and Mongoose for data persistence.

## Overview

The Friendship Connection Visualizer lets you easily map out your social network. You can add people with their first and last names (with an optional birthday), establish relationships between them, and interact with the network through a draggable graph interface. When a node (representing a person) is clicked, a popup appears displaying a detailed list of all relationships for that individual.

## Features

- **User Management**
    - **Add Person:** Use the sidebar form to add individuals by entering first and last names. An optional field for birthday is also available.
    - **Display Format:** On the graph, each person is represented by their first name and the first character of their last name.
    - **Deletion:** Remove people easily from your network with a dedicated delete button.

- **Relationship Management**
    - **Create Relationships:** Build connections by selecting a person from the dropdown and then choosing one or more individuals from a multi-select box for establishing relationships.
    - **Relationship Types:** Visualize different kinds of relationships with unique colors:
        - Blue for friends
        - Green for family
        - Yellow for colleagues
        - Gray for acquaintances

- **Interactive Visualization**
    - **Dynamic Graph:** Use React Flow to view an interactive network graph where nodes are draggable, allowing you to reorganize the display.
    - **Popups:** When clicking on a person in the graph, a popup appears with a detailed list of all their connections and relationship details.

## Tech Stack

- **Backend:**
    - **Node.js & TypeScript:** Server-side development with strong typing.
    - **Express:** Web framework for handling routes and middleware.
    - **Mongoose:** ODM for MongoDB, providing schema-based data management.

- **Frontend:**
    - **React:** User interface library to create interactive components.
    - **Vite:** Fast development environment and build tool.
    - **React Flow:** Library for creating interactive node-based diagrams.

## Project Structure

```plaintext
frontend/
├── src/
│   ├── api/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── App.tsx     
│   ├── main.tsx     
│   ├── index.html     
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # API controllers
│   ├── middleware/      # Authentication middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── types/           # TypeScript interfaces
│   ├── app.ts           # Express app setup
│   └── server.ts        # Entry point
├── .env                 # Environment variables
├── .gitignore           # Git ignore file
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript configuration
```

## Installation

### Prerequisites

- **Node.js** (v22 recommended)
- **npm** or **yarn**
- **MongoDB** for the database

### Backend Setup

1. Clone repo
2. Install dependencies:
    ```bash
    yarn install
    ```
3. Create a `.env` file to store configuration variables (e.g., MongoDB URI, PORT, etc.).
4. Start the server in development mode:
    ```bash
    npm run dev
    ```

### Frontend Setup

1. Navigate to the frontend folder:
    ```bash
    cd frontend
    ```
2. Install dependencies:
    ```bash
    yarn install
    ```
3. Start the development server:
    ```bash
    npm run dev
    ```

## Usage

1. **Adding People:**
    - Use the sidebar to enter the first name, last name, and optionally, a birthday.
    - Click the **Add** button to add the person to your network.

2. **Creating Relationships:**
    - In the relationship menu, select the first person.
    - Use the multi-select dropdown to choose one or more people for the relationship.
    - Choose the relationship type (friends, family, colleagues, or acquaintances) and create the connection.

3. **Interacting with the Graph:**
    - Drag nodes around the visualization area to reorganize your network.
    - Click a node to open a popup displaying the person’s detailed relationship list.

4. **Deleting People:**
    - Click the delete button on a node or in the popup to remove a person from the network.

## Future Enhancements

- **Enhanced User Profiles:** Additional fields and profile pictures.
- **Search and Filter:** Advanced search capabilities to quickly find people or relationships.
- **Real-time Updates:** Incorporate WebSockets for live network updates.
- **Mobile Responsiveness:** Optimizations for mobile devices.

## Contributing

Contributions are welcome! If you have any ideas, bug reports, or feature requests, please open an issue or submit a pull request.  
Ensure that all code and comments in the source code remain in English to maintain consistency.

## License

This project is licensed under the Custom Proprietary License – see the [LICENSE.txt](LICENSE.txt) file for details.

