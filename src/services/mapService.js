import mapboxgl from 'mapbox-gl';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { accessToken } from '../utils/constants';

// Default coordinates and zoom level for map initialization
const defaultCoordinates = [-103.5917, 40.6699];
const defaultZoom = 9; // Default zoom level

/**
 * Initializes the map on the given container with default settings.
 * @param {HTMLElement} container - The container to initialize the map in.
 * @param {Function} setLng - Setter function for longitude state.
 * @param {Function} setLat - Setter function for latitude state.
 * @param {Function} setZoom - Setter function for zoom level state.
 * @param {Function} setMapInitialized - Setter function to indicate map initialization is complete.
 * @returns {mapboxgl.Map} The initialized map instance.
 */
const initializeMap = (container, setLng, setLat, setZoom, setMapInitialized) => {
    mapboxgl.accessToken = accessToken;

    const map = new mapboxgl.Map({
        container: container,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: defaultCoordinates,
        zoom: defaultZoom
    });

    map.on('load', () => {
        setMapInitialized(true);
        setLng(defaultCoordinates[0]);
        setLat(defaultCoordinates[1]);
        setZoom(defaultZoom);

        map.resize(); // Ensure map resizes correctly
    });

    map.on('move', () => {
        setLng(map.getCenter().lng.toFixed(4));
        setLat(map.getCenter().lat.toFixed(4));
        setZoom(map.getZoom().toFixed(2));
    });

    return map;
};

/**
 * Loads the map into the specified container, optionally using geolocation for the initial center.
 * @param {HTMLElement} container - The container to load the map into.
 * @param {Function} setLng - Setter function for longitude state.
 * @param {Function} setLat - Setter function for latitude state.
 * @param {Function} setZoom - Setter function for zoom level state.
 * @param {Function} setMapInitialized - Setter function to indicate map initialization is complete.
 * @param {Function} onFeatureSelect - Callback function for handling feature selection events.
 */
export const loadMap = (container, setLng, setLat, setZoom, setMapInitialized, onFeatureSelect) => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const userLng = position.coords.longitude;
            const userLat = position.coords.latitude;
            const map = initializeMap(container, setLng, setLat, setZoom, setMapInitialized);
            map.setCenter([userLng, userLat]);
        }, () => {
            initializeMap(container, setLng, setLat, setZoom, setMapInitialized);  
        });
    } else {
        initializeMap(container, setLng, setLat, setZoom, setMapInitialized);
    }
};
