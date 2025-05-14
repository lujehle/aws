/* Wetterstationen Euregio Beispiel */

// Innsbruck
let ibk = {
    lat: 47.267222,
    lng: 11.392778,
    zoom: 11,
};

// Karte initialisieren
let map = L.map("map").setView([ibk.lat, ibk.lng], ibk.zoom);

// thematische Layer als feature group, groups sind noch leer
let overlays = {
    stations: L.featureGroup(), //Stationen beim aufrufen der Seite noch nicht sichtbar
    temperature: L.featureGroup().addTo(map),
    wind: L.featureGroup().addTo(map),
    snow: L.featureGroup().addTo(map)
}

// Layer control
L.control.layers({
    "Relief avalanche.report": L.tileLayer(
        "https://static.avalanche.report/tms/{z}/{x}/{y}.webp", {
        attribution: `© <a href="https://sonny.4lima.de">Sonny</a>, <a href="https://www.eea.europa.eu/en/datahub/datahubitem-view/d08852bc-7b5f-4835-a776-08362e2fbf4b">EU-DEM</a>, <a href="https://lawinen.report/">avalanche.report</a>, all licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>`
    }).addTo(map),
    "OpenStreetMap": L.tileLayer.provider("OpenStreetMap.Mapnik"),
    "OpenTopoMap": L.tileLayer.provider("OpenTopoMap"),
    "Esri WorldImagery": L.tileLayer.provider("Esri.WorldImagery"),
}, {
    "Wetterstationen": overlays.stations,
    "Temperatur": overlays.temperature,
    "Wind": overlays.wind,
    "Schnee":overlays.snow

}).addTo(map);

// Maßstab
L.control.scale({
    imperial: false,
}).addTo(map);

// Wetterstationen
async function loadStations(url) {
    let response = await fetch(url);
    let jsondata = await response.json(); //in json data umwandeln

    // Wetterstationen mit Icons und Popups
    const awsIcon = L.icon({
        iconUrl: "icons/wifi.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
    
    L.geoJSON(jsondata, { //Verarbeitet GeoJSON-Daten und erstellt Leaflet-Layer, jsondata GeoJSON-Objekt (z. B. Punktdaten, Linien, Polygone)
        pointToLayer: function (feature, latlng) {
            return L.marker(   //marker wird an Position latlng gesetzt
                latlng, {
                icon: awsIcon
            }

            )
        },
        //popup gestaltung für wetterstationen
        onEachFeature: function (feature, layer) {
            //bindet popup fenster an marker, darunter werden inhalte gefüllt
            layer.bindPopup(` 
                <h4>${feature.properties.name} (${feature.geometry.coordinates[2]}m)</h4>
                <ul>
                    <li>Lufttemperatur (C) ${feature.properties.LT !== undefined ? feature.properties.LT : "-"}</li>
                    <li> Relative Luftfeuchte (%) ${feature.properties.HR}</li>
                    <li> Windgeschwindigkeit (km/h) ${feature.properties.WG}</li>
                    <li> Schneehöhe (cm) ${feature.properties.HS}</li>
                    </ul>
                    <span>$</span>
                    `);
        }
    }).addTo(overlays.stations) //fügt alle Marker mit popups zu stations feature group hinzu
    showTemperature(jsondata);
    showWind(jsondata);
    showSnow(jsondata)
}
loadStations("https://static.avalanche.report/weather_stations/stations.geojson");


function showsnow(jsondata) {
    L.geoJSON(jsondata, {
        filter: function (feature) { 
            return feature.properties.HS !== undefined && feature.properties.HS >= 0;
        },
        pointToLayer: function (feature, latlng) {
            let color = getColor(feature.properties.HS, COLORS.snow);
            return L.marker(latlng, {
                icon: L.divIcon({
                    html: `<span style="background-color:${color}">${feature.properties.HS.toFixed(1)}cm</span>`,
                    className: "aws-div-icon-snow"
                })
            });
        }
    }).addTo(overlays.temperature);
}

function showTemperature(jsondata) {
    L.geoJSON(jsondata, {
        filter: function (feature) { //Temperatur (LT) muss zwischen –50 und +50 °C liegen
            return feature.properties.LT > -50 && feature.properties.LT < 50;
        },
        pointToLayer: function (feature, latlng) {
            let color = getColor(feature.properties.LT, COLORS.temperature);
            return L.marker(latlng, {
                icon: L.divIcon({
                    html: `<span style="background-color:${color}">${feature.properties.LT.toFixed(1)}°C</span>`,
                    className: "aws-div-icon"
                })
            });
        }
    }).addTo(overlays.temperature);
}
function getColor(value, ramp) {
    for (let rule of ramp) {
        if (value >= rule.min && value < rule.max) {
            return rule.color;
        }
    }

}

function showWind(jsondata) {
    L.geoJSON(jsondata, {
        filter: function (feature) {
            return feature.properties.WG !== undefined && feature.properties.WG >= 0;
        },
        pointToLayer: function (feature, latlng) {
            let color = getColor(feature.properties.WG, COLORS.wind);
            return L.marker(latlng, {
                icon: L.divIcon({
                    html: `<span style="background-color:${color}">${feature.properties.WG.toFixed(1)} km/h</span>`,
                    className: "aws-div-icon-wind"
                })
            });
        }
    }).addTo(overlays.wind);
}
function getWindColor(value, ramp) {
    for (let rule of ramp) {
        if (value >= rule.min && value < rule.max) {
            return rule.color;
        }
    }

}
let testedColor = getWindColor(5, COLORS.wind);
console.log("TestColor for temp 5", testedColor)



