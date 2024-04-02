export const saveToLocalStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const getFromLocalStorage = (key) => {
    return JSON.parse(localStorage.getItem(key));
};

export const updateGeoJSONSource = (map, geojson) => {
    if (!map || !map.isStyleLoaded()) {
        console.error('Map is not loaded yet');
        return;
    }

    const source = map.getSource('geojson');
    if (source) {
        source.setData(geojson);
    } else {
        console.error('GeoJSON source not found');
    }
};
