import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { accessToken } from '../utils/constant';
import { getFromLocalStorage, saveToLocalStorage, updateGeoJSONSource } from './storageService';

const defaultCoordinates = [-103.5917, 40.6699];
const defaultZoom = 9;

/**
 * Initializes a Mapbox GL map within a specified container element. This function sets up
 * the map with a predefined style, center, and zoom level. It also initializes drawing controls
 * for creating, updating, and deleting geographic features directly on the map. Additionally,
 * it loads any existing GeoJSON data from local storage and adds it to the map. Event listeners
 * are set up to handle map loading, feature clicking, and map movements, allowing for interactive
 * manipulation and data retrieval from the map.
 *
 * @param {HTMLElement} container - The DOM element where the map will be rendered.
 * @param {Function} setLng - Function to update longitude state on map move.
 * @param {Function} setLat - Function to update latitude state on map move.
 * @param {Function} setZoom - Function to update zoom level state on map move.
 * @param {Function} setMapInitialized - Function to update the map's initialization status.
 * @param {Function} onFeatureSelect - Callback function triggered when a feature is selected on the map.
 */
const initializeMap = (container, setLng, setLat, setZoom, setMapInitialized, onFeatureSelect) => {
    mapboxgl.accessToken = accessToken;

    const map = new mapboxgl.Map({
        container: container,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: defaultCoordinates,
        zoom: defaultZoom
    });

    const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
            polygon: true,
            line_string: true,
            point: true,
            trash: true
        }
    });
    map.addControl(draw);

    map.on('load', () => {
        setMapInitialized(true);
        setLng(defaultCoordinates[0]);
        setLat(defaultCoordinates[1]);
        setZoom(defaultZoom);
        map.resize();

        const geojson = getFromLocalStorage('geojson');
        if (geojson) {
            map.addSource('geojson', {
                type: 'geojson',
                data: geojson
            });
            map.addLayer({
                id: 'geojson-layer',
                type: 'fill',
                source: 'geojson',
                paint: {
                    "fill-color": "#6a0dad",  
                    "fill-opacity": 0.5,     
                }
            });

            map.addLayer({
                id: 'text-label',
                type: 'symbol',
                source: 'geojson',
                layout: {
                    'text-field': ['get', 'name'],
                    'text-size': 14,
                    'text-anchor': 'top'
                }
            })
        }

        map.on('click', 'geojson-layer', (e) => {
            const res = map.queryRenderedFeatures(e.point, { layers: ['geojson-layer'] });
            const res_id = res[0].properties.id
            const geojson = getFromLocalStorage('geojson')
            const selected = geojson.features.find(item => item.id === res_id)
            console.log('selece',selected);
            console.log('res_id',res_id);

            draw.add(selected)
            const name = res.map(property => property.properties?.name)
            console.log('FFF', res.map(property => property.properties));
            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`<b>${name[0]}</b>`)
                .addTo(map)
        });
    });

    map.on('move', () => {
        setLng(map.getCenter().lng.toFixed(4));
        setLat(map.getCenter().lat.toFixed(4));
        setZoom(map.getZoom().toFixed(2));
    });

    addDrawControls(map, draw, onFeatureSelect);

    return map;
};

/**
 * Configures drawing controls for the map and handles creation, update,
 * and deletion of features. This function binds event listeners to the map
 * for draw events and manages the local storage and map source updates
 * accordingly. It ensures that any changes made through the Mapbox Draw
 * controls are reflected both in the browser's local storage and the map's
 * display.
 *
 * @param {mapboxgl.Map} map - The Mapbox GL JS map instance to which the drawing controls are added.
 * @param {MapboxDraw} draw - The MapboxDraw instance used to provide drawing tools on the map.
 * @param {Function} onFeatureSelect - Callback function to handle selection of features after drawing operations.
 */

const addDrawControls = (map, draw, onFeatureSelect) => {
    function handleCreateFeature(map, draw, onFeatureSelect) {
        console.log('Create event');
        const eventType = 'draw.create';
        const drawnFeatures = draw.getAll().features;

        const existingFeatures = getFromLocalStorage('geojson')?.features || [];

        const newFeatures = drawnFeatures.map((feature, index) => {
            const id = feature.id || Date.now() + index;
            console.log("id",id);
            return { ...feature, properties: { ...feature.properties, id } };
        });

        const updatedFeatures = [...existingFeatures, ...newFeatures];
        console.log('updatedFeatures', updatedFeatures);
        // save update features to local storage
        saveToLocalStorage('geojson', { type: 'FeatureCollection', features: updatedFeatures });

        // update map dataset
        updateGeoJSONSource(map, { type: 'FeatureCollection', features: updatedFeatures });

        if (onFeatureSelect) {
            onFeatureSelect({ type: eventType, features: updatedFeatures })
        }
    }

    function handleUpdateFeature(map, draw, onFeatureSelect) {
        console.log('Update event');
        const eventType = 'draw.update';
        const drawnFeatures = draw.getAll().features;

        const existingFeatures = getFromLocalStorage('geojson')?.features || [];

        // make sure id is unique
        const featuresMap = new Map(existingFeatures.map(feature => [feature.properties.id, feature]));

        for (const feature of drawnFeatures) {
            featuresMap.set(feature.properties.id, feature);
        }

        const updatedFeatures = Array.from(featuresMap.values());

        // save update features to local storage
        saveToLocalStorage('geojson', { type: 'FeatureCollection', features: updatedFeatures });

        // update map dataset
        updateGeoJSONSource(map, { type: 'FeatureCollection', features: updatedFeatures });

        if (onFeatureSelect) {
            onFeatureSelect({ type: eventType, features: updatedFeatures })
        }
    }

    function handleDeleteFeature(map, featureId) {
        try {
            // Fetch GEOJSON Data from localStorage
            const storedData = localStorage.getItem('geojson');
            const geojson = storedData ? JSON.parse(storedData) : { type: "FeatureCollection", features: [] };

            // Filter 
            const updatedFeatures = geojson.features.filter(feature => feature.id !== featureId);

            // Update localStorage
            const updatedGeoJSON = { type: "FeatureCollection", features: updatedFeatures };
            localStorage.setItem('geojson', JSON.stringify(updatedGeoJSON));

            // Update Map GEO dataset
            updateGeoJSONSource(map, { type: 'FeatureCollection', features: updatedFeatures });

        } catch (error) {
            console.error('Error deleting feature:', error);
            // TODO: Handle the exception appropriately
        }
    }
    
    // Add a listener for creating layers
    map.on('draw.create', function (e) {
        handleCreateFeature(map, draw, onFeatureSelect);
    });

    // Listen for editing events
    map.on('draw.update', function (e) {
        handleUpdateFeature(map, draw, onFeatureSelect);
    });

    // Listen for delete events
    map.on('draw.delete', function (e) {
        const featureId = e.features[0].id;
        handleDeleteFeature(map, draw, featureId);
    });
};


/**
 * Initializes and loads the Mapbox map into the specified container.
 * This function sets up the map with a default configuration and centers it
 * on the user's current location if geolocation is available and permitted.
 * If geolocation is not available or the user denies permission, the map
 * will default to a predefined location.
 * 
 * @param {HTMLElement} container - The DOM element where the map will be loaded.
 * @param {Function} setLng - Function to set the longitude in the state.
 * @param {Function} setLat - Function to set the latitude in the state.
 * @param {Function} setZoom - Function to set the zoom level in the state.
 * @param {Function} setMapInitialized - Function to update the map initialization state.
 * @param {Function} onFeatureSelect - Callback function to handle feature selection on the map.
 */
export const loadMap = (container, setLng, setLat, setZoom, setMapInitialized, onFeatureSelect) => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const userLng = position.coords.longitude;
            const userLat = position.coords.latitude;
            initializeMap(container, setLng, setLat, setZoom, setMapInitialized, onFeatureSelect).setCenter([userLng, userLat]);
        }, () => {
            initializeMap(container, setLng, setLat, setZoom, setMapInitialized, onFeatureSelect);
        });
    } else {
        initializeMap(container, setLng, setLat, setZoom, setMapInitialized, onFeatureSelect);
    }
};
