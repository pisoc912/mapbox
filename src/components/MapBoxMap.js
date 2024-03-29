import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

function MapBoxMap() {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng, setLng] = useState(-70.9);
    const [lat, setLat] = useState(42.35);
    const [zoom, setZoom] = useState(9);
    const [mapInitialized, setMapInitialized] = useState(false);

    useEffect(() => {
        if (!mapInitialized) {
            navigator.geolocation.getCurrentPosition(position => {
                // update user current location
                const userLng = position.coords.longitude;
                const userLat = position.coords.latitude;

                // Initialize map
                map.current = new mapboxgl.Map({
                    container: mapContainer.current,
                    style: 'mapbox://styles/mapbox/streets-v12',
                    center: [position.coords.longitude, position.coords.latitude],
                    zoom: zoom
                });

                map.current.on('load', () => {
                    setLng(userLng);
                    setLat(userLat);
                    setMapInitialized(true)
                })

                map.current.on('move', () => {
                    setLng(map.current.getCenter().lng.toFixed(4));
                    setLat(map.current.getCenter().lat.toFixed(4));
                    setZoom(map.current.getZoom().toFixed(2));
                });
            }, err => {
                console.error('Error getting current position:', err);
                // Initialize map using default location
                map.current = new mapboxgl.Map({
                    container: mapContainer.current,
                    style: 'mapbox://styles/mapbox/streets-v12',
                    center: [lng, lat],
                    zoom: zoom
                });

                map.current.on('load', () => {
                    setMapInitialized(true)
                })
            });
        }
    }, [mapInitialized]);

    return (
        <div>
            <div ref={mapContainer} className="map-container" />
        </div>
    );
}

export default MapBoxMap;