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
export const initializeMap = (container, setLng, setLat, setZoom, setMapInitialized, onFeatureSelect) => {
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
        console.log("geojson", geojson);
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
        updateGeoJSONSource(map, geojson);
        map.on('click', 'geojson-layer', (e) => {
            try {
                const res = map.queryRenderedFeatures(e.point, { layers: ['geojson-layer'] });
                if (res.length > 0) {
                    const res_id = res[0].properties.id;
                    const geojson = getFromLocalStorage('geojson');
                    if (geojson && Array.isArray(geojson.features)) {
                        const selected = geojson.features.find(item => item.id === res_id);

                        if (selected) {
                            draw.add(selected);
                            const name = selected.properties.name;
                            console.log('Selected feature', selected);
                            new mapboxgl.Popup()
                                .setLngLat(e.lngLat)
                                .setHTML(`<b>${name}</b>`)
                                .addTo(map);
                        } else {
                            console.error('Selected feature not found in local storage');
                        }
                    } else {
                        console.error('Invalid GeoJSON data in local storage');
                    }
                } else {
                    console.error('No features found at the clicked location');
                }
            } catch (error) {
                console.error('Error handling click event on geojson-layer:', error);
            }
        });

        map.on('click', 'text-label', (e) => {
            const eventType = 'draw.changeName'
            const featureId = e.features[0].properties.id
            onFeatureSelect({ type: eventType, id: featureId })
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

  
        if (drawnFeatures.length > 0) {
            const newFeature = drawnFeatures[drawnFeatures.length - 1];
            updateGeoJSONSource(map, { type: 'FeatureCollection', features: newFeature });

            onFeatureSelect({ type: eventType, features: newFeature })
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
            // Fetch GeoJSON data from localStorage
            const storedData = localStorage.getItem('geojson');
            const geojson = storedData ? JSON.parse(storedData) : { type: "FeatureCollection", features: [] };

            // Filter out the feature with the given featureId
            const updatedFeatures = geojson.features.filter(feature => {
                // Assuming the feature id is directly on the feature, not in properties
                return feature.id !== featureId;
            });

            // Check if the filtering actually removed any feature
            if (geojson.features.length === updatedFeatures.length) {
                console.warn(`Feature with id ${featureId} not found.`);
                return;
            }

            // Update localStorage with the new set of features
            const updatedGeoJSON = { type: "FeatureCollection", features: updatedFeatures };
            localStorage.setItem('geojson', JSON.stringify(updatedGeoJSON));

            // Update map GeoJSON dataset
            updateGeoJSONSource(map, updatedGeoJSON);

        } catch (error) {
            console.error('Error deleting feature:', error);
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
        console.log('featureId', featureId);
        console.log(e.features);
        handleDeleteFeature(map, featureId);
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
