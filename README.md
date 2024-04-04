# MapBoxMap Component


https://github.com/pisoc912/perimeter/assets/123050861/0580b97c-88a5-4667-8640-28de6ab5f100


## Overview

MapBoxMap is a React component designed to integrate a Mapbox GL JS map into your React application. It enables interactive mapping functionalities, including displaying and editing geographic data directly within the map interface.

## Features

- Map initialization with Mapbox GL JS
- GeoJSON data management
- Interactive drawing and editing of map features
- Popup dialog for feature property editing
- Local storage for data persistence

### Installation

Follow these steps to set up the MapBoxMap component in your project:

1. **Install dependencies**:

   Execute the following command to install the required dependencies:

   ```bash
    npm install mapbox-gl @mapbox/mapbox-gl-draw
    npm install @mui/material
   ```

2. **Set up Mapbox Access Token**:

   Create a `.env` file in the root of your project and add your Mapbox access token:

   ```plaintext
   REACT_APP_MAPBOX_ACCESS_TOKEN=Your_Mapbox_Access_Token_Here
   ```

   In your project, create a file `constants.js` to handle environment variables:

   ```javascript
   // constants.js
   export const accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
   ```

   Ensure you import and use `accessToken` in your Mapbox-related code to authenticate requests.

3. **Import the Component**:

   Import `MapBoxMap` into your React application where it is needed:

   ```javascript
   import MapBoxMap from './MapBoxMap'; // Adjust the path as necessary
   ```

### Running Your Application

To run your React application, execute the following command:

```bash
npm start
```

This command starts the development server and opens the application in your default web browser.

## Component Details

### `MapBoxMap`

- Renders the map and manages state and user interactions.
- Facilitates feature creation, selection, and name editing via `PopupDialog`.

#### Features

- Interactive map with capabilities to zoom and pan.
- Create and edit features using `PopupDialog`.
- Store and retrieve map features using local storage.

### `PopupDialog`

- Modal dialog for entering or editing map feature names.
- Triggered when a feature is either created or selected for editing.

## Services and Utilities

- **Map Service (`mapService.js`)**: Initializes and configures the map.
- **Storage Service (`storageService.js`)**: Manages saving and retrieving of data from local storage.

## Integration

Integrate `MapBoxMap` in your React application where a map display is required. It is self-contained, managing its state and lifecycle, hence requiring minimal setup.
