mapboxgl.accessToken = 'pk.eyJ1IjoiajAwYnkiLCJhIjoiY2x1bHUzbXZnMGhuczJxcG83YXY4czJ3ayJ9.S5PZpU9VDwLMjoX_0x5FDQ'; // Your Mapbox access token 

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-85.7682, 37.8393],
    zoom: 6.8,
    minZoom: 6.8 // Prevents zooming out below initial view
});

map.on('load', function () {
    addLayers();
    handleMapClick();
});

const tooltip = document.getElementById('map-tooltip');

map.on('mousemove', (e) => {
    const features = map.queryRenderedFeatures(e.point, {
        layers: ['femaDisasters'] // Only show tooltip on county layer
    });

    if (features.length > 0) {
        map.getCanvas().style.cursor = 'pointer';
        const countyName = features[0].properties.NAMELSAD;

        tooltip.style.display = 'block';
        tooltip.style.left = e.point.x + 15 + 'px';
        tooltip.style.top = e.point.y + 15 + 'px';
        tooltip.innerHTML = `Click to learn more about <br><strong>${countyName}</strong>`;
    } else {
        map.getCanvas().style.cursor = '';
        tooltip.style.display = 'none';
    }
});


function addLayers() {
    // FEMA Disaster Declarations by County Level
    map.addSource('kentuckyFema', {
        type: 'geojson',
        data: 'data/KY_FEMA_County.json'
    });

    map.addLayer({
        'id': 'femaDisasters',
        'type': 'fill',
        'source': 'kentuckyFema',
        'paint': {
            'fill-color': [
                'match',
                ['to-number', ['get', 'COUNTY_DISASTER_COUNT'], 0],
                0, '#ffffff', 1, '#fee5d9', 2, '#fee5d9',
                3, '#fcae91', 4, '#fcae91', 5, '#fb6a4a',
                6, '#fb6a4a', 7, '#de2d26', 8, '#de2d26',
                9, '#de2d26', 10, '#a50f15', 11, '#a50f15',
                12, '#a50f15', 13, '#a50f15', 14, '#a50f15',
                15, '#a50f15', 16, '#a50f15', '#ffffff'
            ],
            'fill-opacity': 1
        }
    });

    addCongressionalLayers();
    addHouseLayers();
    addSenateLayers();
}

function addCongressionalLayers() {
    map.addSource('kyCongress', {
        type: 'geojson',
        data: 'data/KY_Congress.json'
    });

    map.addLayer({
        'id': 'congressionalDistricts',
        'type': 'fill',
        'source': 'kyCongress',
        'paint': {
            'fill-color': 'transparent',
            'fill-outline-color': '#000000'
        }
    });
}

function addHouseLayers() {
    map.addSource('kyHouse', {
        type: 'geojson',
        data: 'data/KY_House.json'
    });

    map.addLayer({
        'id': 'houseDistricts',
        'type': 'fill',
        'source': 'kyHouse',
        'paint': {
            'fill-color': 'transparent',
            'fill-outline-color': '#000000'
        }
    });
}

function addSenateLayers() {
    map.addSource('kySenate', {
        type: 'geojson',
        data: 'data/KY_Senate.json'
    });

    map.addLayer({
        'id': 'senateDistricts',
        'type': 'fill',
        'source': 'kySenate',
        'paint': {
            'fill-color': 'transparent',
            'fill-outline-color': '#000000'
        }
    });
}

function handleMapClick() {
    map.on('click', function (e) {
        var features = map.queryRenderedFeatures(e.point, {
            layers: ['femaDisasters', 'congressionalDistricts', 'houseDistricts', 'senateDistricts']
        });

        if (features.length > 0) {
            var featureData = consolidateFeatureData(features);
            var popupContent = createPopupContent(featureData);
            showPopup(e.lngLat, popupContent);
        }
    });
}

function consolidateFeatureData(features) {
    var featureData = {
        countyName: '',
        disasters: '',
        femaObligations: '',
        countyPopulation: '',
        countyPerCapita: '',
        congressionalDist: '',
        congressRepName: '',
        houseDist: '',
        houseRepName: '',
        senateDist: '',
        senateRepName: ''
    };

    features.forEach(function(feature) {
        switch (feature.layer.id) {
            case 'femaDisasters':
                featureData.countyName = feature.properties.NAMELSAD;
                featureData.disasters = feature.properties.COUNTY_DISASTER_COUNT;
                featureData.femaObligations = feature.properties.COUNTY_TOTAL_FEMA;
                featureData.countyPopulation = feature.properties.COUNTY_POPULATION;
                featureData.countyPerCapita = feature.properties.COUNTY_PER_CAPITA;
                featureData.countySVI = feature.properties.SVI_2022;
                break;
            case 'congressionalDistricts':
                featureData.congressionalDist = feature.properties.OFFICE_ID;
                featureData.congressRepName = feature.properties.FIRSTNAME + ' ' + feature.properties.LASTNAME;
                break;
            case 'houseDistricts':
                featureData.houseDist = feature.properties.District;
                featureData.houseRepName = feature.properties.Full_Name;
                break;
            case 'senateDistricts':
                featureData.senateDist = feature.properties.District;
                featureData.senateRepName = feature.properties.Full_Name;
                break;
        }
    });

    return featureData;
}

function createPopupContent(featureData) {
    return `
       <div style="color: #000;">
    <h2 style="color: #a50f15;">${featureData.countyName}</h2>
    <strong>Federal Disaster Declarations:</strong> ${featureData.disasters || 'N/A'}<br>
    <strong>FEMA Obligations (PA+HM):</strong> ${featureData.femaObligations ? `${parseFloat(featureData.femaObligations).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}` : 'N/A'}<br>
    <strong>County Population:</strong> ${featureData.countyPopulation ? parseInt(featureData.countyPopulation).toLocaleString('en-US') : 'N/A'}<br>
    <strong>County Per Capita:</strong> ${featureData.countyPerCapita ? `${parseFloat(featureData.countyPerCapita).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}` : 'N/A'}<br>
    <strong>SVI Score:</strong> ${featureData.countySVI  || 'N/A'}
    <h2 style="color: #a50f15;">Legislative Members</h2>
    <strong>Congress:</strong> ${featureData.congressRepName || 'N/A'} (${featureData.congressionalDist || 'N/A'})<br>
    <strong>House of Representative:</strong> ${featureData.houseRepName || 'N/A'} (${featureData.houseDist || 'N/A'})<br>
    <strong>Senate:</strong> ${featureData.senateRepName || 'N/A'} (${featureData.senateDist || 'N/A'})
    <p style="color: gray; font-style: italic; font-size: 0.9em;">* <a href="https://rebuildbydesign.org/atlas-of-accountability/" target="_blank" style="color: gray;">Atlas of Accountability (2011-2024) by Rebuild by Design</a></p>

</div>


    `;
}

function showPopup(lngLat, content) {
    new mapboxgl.Popup()
        .setLngLat(lngLat)
        .setHTML(content)
        .addTo(map);
}
