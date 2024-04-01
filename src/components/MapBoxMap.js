import React, { useRef, useEffect, useState } from 'react';
import { loadMap } from '../services/mapService';

function MapBoxMap() {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng, setLng] = useState(-70.9);
    const [lat, setLat] = useState(42.35);
    const [zoom, setZoom] = useState(9);
    const [mapInitialized, setMapInitialized] = useState(false);

    useEffect(() => {
        if (mapContainer.current && !mapInitialized) {
            loadMap(mapContainer.current, setLng, setLat, setZoom, setMapInitialized);
        }
    }, [mapInitialized]);

    return (
        <div>
            <div ref={mapContainer} className="map-container" />
        </div>
    );
}

export default MapBoxMap;