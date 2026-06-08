# Exam #1: "Last Race"
## Student: s355377 Sima Houshmand 

## 1. Server-side

### HTTP APIs
* **POST `/api/sessions`**: Authenticates a user. Request body: `{username, password}`. Returns the authenticated user object.
* **GET `/api/sessions/current`**: Checks if the user is currently logged in. Returns the user object or a 401 error.
* **DELETE `/api/sessions/current`**: Logs out the current user and clears the session cookie.
* **GET `/api/network`**: Retrieves the complete underground network. Returns an object containing arrays of `stations`, `lines`, and `connections`.
* **GET `/api/events`**: Retrieves all random unexpected events. Returns an array of event objects with descriptions and coin effects.
* **GET `/api/rankings`**: Retrieves the global leaderboard. Returns an array of user scores ordered by highest best score.
* **POST `/api/games`**: Saves a completed game score. Request body: `{ score }`. Requires authentication. Returns the saved game ID.

### Database Tables
* **`users`**: Stores registered user credentials, including securely hashed and salted passwords.
* **`stations`**: Stores the unique IDs and names of all stations in the network.
* **`lines`**: Stores the unique IDs and names of the four metro lines.
* **`connections`**: Maps stations to lines in a specific sequence to define the valid travel segments.
* **`events`**: Stores the random events, containing their descriptive text and integer coin effect (-4 to +4).
* **`games`**: Stores the final scores of completed games, linked to the user who played them via foreign key.

## 2. Client-side

### React Routes
* **`/` (Home)**: Displays the game instructions for anonymous users. Automatically redirects logged-in users to the `/play` route.
* **`/login`**: Displays the login form for unauthenticated users. Redirects to `/play` upon successful login.
* **`/play`**: The main game interface. Protected route that manages all four phases of the game (Setup, Planning, Execution, Result).
* **`/rankings`**: Displays the global leaderboard. Protected route showing the best scores of all players.

### Main React Components
* **`App` (in `App.jsx`)**: The main application shell. Manages React Router setup and the global authentication state (`user`, `loggedIn`).
* **`Navigation` (in `Navigation.jsx`)**: The top navigation bar. Displays conditional links based on auth state and handles the logout action.
* **`LoginForm` (in `LoginForm.jsx`)**: Renders the username and password inputs, handling the API call to authenticate and redirect.
* **`GameLayout` (in `GameLayout.jsx`)**: The core game state machine. Manages the 90-second timer, route building logic, step-by-step execution, and score saving.
* **`Instructions` (in `Instructions.jsx`)**: A static component displaying the rules of "Last Race" for anonymous users.
* **`Rankings` (in `Rankings.jsx`)**: Fetches and displays a table of the top scores from the database.

## 3. Overall

### Screenshots

*(Replace the placeholder links below with the actual paths to your screenshots)*

![Rankings Page](./ranking.png)
*Screenshot 1: The general rankings page.*

![Gameplay Execution](./path-to-your-gameplay-screenshot.png)
*Screenshot 2: A player in the middle of the Execution phase.*

### Test Credentials
* **Username:** player1 | **Password:** password
* **Username:** player2 | **Password:** password
* **Username:** player3 | **Password:** password

### AI Usage
During the development of this project, I utilized an AI assistant (Google Gemini) to help structure the React Single Page Application and configure the Node.js/Express backend. Specifically, the AI assisted in formatting the `GameLayout.jsx` state machine to manage the four game phases, writing the `fetch` API wrappers in `API.js`, and ensuring the Express session handling with Passport.js was correctly implemented according to course standards. All output was reviewed, tested, and integrated into my personal workspace.