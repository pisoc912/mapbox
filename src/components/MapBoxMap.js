import React, { useRef, useEffect, useState } from 'react';
import { loadMap } from '../services/mapService';
import PopupDialog from './PopupDialog';
import { getFromLocalStorage, saveToLocalStorage } from '../services/storageService';

function MapBoxMap() {
    const mapContainer = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [featureData, setFeatureData] = useState(null);
    const [lng, setLng] = useState(-103.5917);
    const [lat, setLat] = useState(40.6699);
    const [zoom, setZoom] = useState(9);
    const [mapInitialized, setMapInitialized] = useState(false);
    const [dialogMode, setDialogMode] = useState('create');  


    useEffect(() => {
        
        if (mapContainer.current && !mapInitialized) {
            loadMap(
                mapContainer.current,
                setLng,
                setLat,
                setZoom,
                setMapInitialized,
                onFeatureSelect,
            )
        }
    }, [mapInitialized,featureData]);

    const onFeatureSelect = (e) => {
        console.log('Event type:', e.type);
        console.log('Features:', e.features);
        if (e.type === 'draw.create') {
            setFeatureData(e.features);
            setDialogMode('create')
            setIsModalOpen(true);
        }
        if (e.type === 'draw.changeName') {
            const storedGeoJson = getFromLocalStorage('geojson');
            console.log(storedGeoJson);
            if (storedGeoJson && Array.isArray(storedGeoJson.features)) {
                const currentFeature = storedGeoJson.features.find(f => f.id === e.id);
                console.log('currentFeature', currentFeature);

                if (currentFeature) {
                    setFeatureData(currentFeature);
                    setIsModalOpen(true);
                    setDialogMode('changeName');
                }
            }
        }
    };

    const handleModalOk = (data) => {
        console.log("data", data);
        console.log("featureData", featureData);

        if (data && featureData) {
            const name = data.properties.name
            // Get the currently stored GeoJSON data
            const storedGeoJson = getFromLocalStorage('geojson');
            let featuresArray = storedGeoJson && storedGeoJson.features ? storedGeoJson.features : [];

            // Check if feature already exists
            const featureIndex = featuresArray.findIndex(f => f.id === featureData.id);
            console.log('featureIndex', featureIndex);
            // If it exists, update the feature
            if (featureIndex >= 0) {
                featuresArray[featureIndex] = { ...featureData, properties: { ...featureData.properties, name: name } };
            } else {
                // If it does not exist, add a new feature
                console.log('F_ID',featureData.id);
                if(featureData.id){
                    featuresArray.push({ ...featureData, properties: { ...featureData.properties, name: name, id: featureData.id } });
                }
            }

            // Save updated GeoJSON to localStorage
            const updatedGeoJson = {...storedGeoJson,type: 'FeatureCollection', features: featuresArray };
            saveToLocalStorage('geojson', updatedGeoJson);

            console.log('Saving to localStorage:', updatedGeoJson);
            setIsModalOpen(false);
        }
    };



    return (
        <div>
            <div ref={mapContainer} data-testid="map-container" className="map-container" style={{ height: '100vh' }}>
                {mapInitialized && <p>Map is loaded</p>}
            </div>
            {isModalOpen && (
                <PopupDialog
                    mode={dialogMode}
                    isOpen={isModalOpen}
                    onOk={handleModalOk}
                    onCancel={() => setIsModalOpen(false)}
                    data={featureData}
                >
                    Feature Details: {featureData ? featureData.properties.name : 'No feature selected'}
                </PopupDialog>
            )}
        </div>
    );
}

export default MapBoxMap