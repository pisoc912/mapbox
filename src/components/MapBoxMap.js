import React, { useRef, useEffect, useState } from 'react';
import { loadMap } from '../services/mapService';
import PopupDialog from './PopupDialog';

function MapBoxMap() {
    const mapContainer = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [featureData, setFeatureData] = useState(null);
    const [lng, setLng] = useState(-103.5917);
    const [lat, setLat] = useState(40.6699);
    const [zoom, setZoom] = useState(9);
    const [mapInitialized, setMapInitialized] = useState(false);

    // onFeatureSelect Functions for handling create, update, and delete events for similar features on the map
    const onFeatureSelect = (e) => {
        console.log('Event type:', e.type);
        console.log('Features:', e.features);

        // Different logic is processed according to the event type.
        if (e.type === 'draw.create') {
            // Save date
            setFeatureData(e.features[0]);
            setIsModalOpen(true);
        }
    };
    useEffect(() => {
        if (mapContainer.current && !mapInitialized) {
            loadMap(mapContainer.current, setLng, setLat, setZoom, setMapInitialized, onFeatureSelect, setIsModalOpen);
        }
    }, [mapInitialized]);

    const handleModalOk = (formData) => {
        console.log('Modal form data:', formData);
        // save name
        setIsModalOpen(false);
    };
    return (
        <div>
            <div ref={mapContainer} className="map-container" />
            <PopupDialog
                isOpen={isModalOpen}
                onOk={handleModalOk}
                onCancel={() => setIsModalOpen(false)}
                data={featureData}
            />
        </div>
    );
}

export default MapBoxMap;
