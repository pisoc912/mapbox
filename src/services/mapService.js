import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { accessToken } from '../utils/constant';
import { getFromLocalStorage, saveToLocalStorage, updateGeoJSONSource } from './storageService';

const defaultCoordinates = [-103.5917, 40.6699];
const defaultZoom = 9;

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
                    "fill-color": "#888",
                    "fill-opacity": 0.4
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
const addDrawControls = (map, draw, onFeatureSelect) => {
    const updateAndSaveFeatures = (e) => {
        const eventType = e.type;
        const drawnFeatures = draw.getAll().features;

        // fetch local features
        const existingFeatures = getFromLocalStorage('geojson')?.features || [];

        let updatedFeatures;

        if (eventType === 'draw.create') {
            // add id into properties
            const newFeatures = e.features.map((feature, index) => {
                const id = feature.id || Date.now() + index;
                return { ...feature, properties: { ...feature.properties, id } };
            });
            // combine all features
            updatedFeatures = [...existingFeatures, ...newFeatures];
        } else {
            // make sure id is unique
            const featuresMap = new Map(existingFeatures.map(feature => [feature.properties.id, feature]));

            for (const feature of drawnFeatures) {
                featuresMap.set(feature.properties.id, feature);
            }

            updatedFeatures = Array.from(featuresMap.values());
        }

        // save update features to local storage
        saveToLocalStorage('geojson', { type: 'FeatureCollection', features: updatedFeatures });

        // update map dateset
        updateGeoJSONSource(map, { type: 'FeatureCollection', features: updatedFeatures });

        // call on featureSelect
        if (onFeatureSelect) {
            onFeatureSelect({ type: eventType, features: e.features });
        }
    };

    map.on('draw.create', updateAndSaveFeatures);
    map.on('draw.update', updateAndSaveFeatures);
    map.on('draw.delete', updateAndSaveFeatures);
};


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
