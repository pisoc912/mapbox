import React, { useRef, useEffect, useState } from 'react';
import { loadMap } from '../services/mapService';
import PopupDialog from './PopupDialog';
import { getFromLocalStorage, saveToLocalStorage, updateGeoJSONSource } from '../services/storageService';

function MapBoxMap() {
    const mapContainer = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [featureData, setFeatureData] = useState(null);
    const [lng, setLng] = useState(-103.5917);
    const [lat, setLat] = useState(40.6699);
    const [zoom, setZoom] = useState(9);
    const [mapInitialized, setMapInitialized] = useState(false);
    const [mapInstance, setMapInstance] = useState(null);

    useEffect(() => {
        if (mapContainer.current && !mapInitialized) {
            const map = loadMap(
                mapContainer.current,
                setLng,
                setLat,
                setZoom,
                setMapInitialized,
                onFeatureSelect
            );
            setMapInstance(map);
        }
    }, [mapInitialized]);

    const onFeatureSelect = (e) => {
        console.log('Event type:', e.type);
        console.log('Features:', e.features);
        if (e.type === 'draw.create') {
            setFeatureData(e.features[0]);
            setIsModalOpen(true);
        }
    };

    const handleModalOk = (data) => {
        let updatedFeatures = getFromLocalStorage('geojson');
        const featureIndex = updatedFeatures.features.findIndex(f => f.id === featureData.id);

        if (featureIndex !== -1) {
            updatedFeatures.features[featureIndex].properties.name = data.name;
            setFeatureData(updatedFeatures.features[featureIndex]);
            saveToLocalStorage('geojson', updatedFeatures);

            // Update the map's data source to reflect the changes
            if (mapInstance) {
                updateGeoJSONSource(mapInstance, updatedFeatures);
            }
        }

        setIsModalOpen(false);
    };

    return (
        <div>
            <div ref={mapContainer} className="map-container" style={{ height: '100vh' }} />
            {isModalOpen && (
                <PopupDialog
                    isOpen={isModalOpen}
                    onOk={handleModalOk}
                    onCancel={() => setIsModalOpen(false)}
                    data={featureData}
                />
            )}
        </div>
    );
}

export default MapBoxMap;
