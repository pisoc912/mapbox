export const saveToLocalStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const getFromLocalStorage = (key) => {
    return JSON.parse(localStorage.getItem(key));
};

//Make sure updateGeoJSONSource is executed after the map style is loaded
export const updateGeoJSONSource = (map, geojson) => {
    if (!map || !map.isStyleLoaded()) {
        console.warn('Map is not loaded yet, retrying...');
        setTimeout(() => updateGeoJSONSource(map, geojson), 1000); // delay, retry
        return;
    }

    const source = map.getSource('geojson-data');
    if (source) {
        source.setData(geojson);
    } else {
        console.error('GeoJSON source not found');
    }
};
