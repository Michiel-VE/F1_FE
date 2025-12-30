# F1 Frontend

## Overview

The F1 Frontend is the user interface for the Formula 1 Dashboard project. It is a Single Page Application (SPA) built with Angular 21 and styled with Tailwind CSS. The frontend communicates with the F1 API to display Formula 1 data such as driver standings, teams, races, and predictions.

## Features

- View Formula 1 standings, teams, and races.
- Display driver career history and profile.
- User predictions functionality (e.g., prediction of race outcomes).
- Routing for different pages (dashboard, teams, drivers, races).
- Responsive design using Tailwind CSS.

## API Integration

The frontend communicates with the backend API via RESTful endpoints. Below are some of the key API calls:

- `GET /api/v1/drivers`: Fetches all F1 drivers.
- `GET /api/v1/teams`: Fetches all teams for a specific season.
- `GET /api/v1/races`: Fetches all races for a specific season.
- `POST /api/v1/prediction`: Submits a user’s prediction.

### Authentication (Planned)

Currently, authentication is not implemented but will be added soon. Future plans include:
- User login with JWT authentication.
- Google OAuth for third-party authentication.

## Project Structure

````
───app
│   ├───components
│   │   ├───drivers
│   │   ├───landing-page
│   │   └───navbar
│   ├───interfaces
│   ├───pipe
│   └───services
└───environments
````


## Routing and Pages

The application has the following main routes/pages:

- `/`: Dashboard with current season standings and stats.
- `/drivers`: List of all F1 drivers.
- `/teams`: List of all teams for the current season.
- `/races`: List of all races in the current season.
- `/profile`: View and manage user profile (to be implemented).
- `/prediction`: Make and view race predictions.

## Styling

The frontend uses Tailwind CSS for responsive design and UI customization. The utility-first approach makes styling components easy and maintainable.

## Setup and Development

### Requirements

- Node.js (>= 14.x)
- Angular CLI (>= 12.x)
- Tailwind CSS configured
