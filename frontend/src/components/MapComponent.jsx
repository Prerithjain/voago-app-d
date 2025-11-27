import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Note: Replace with your actual Mapbox token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZGVtb3VzZXIwMSIsImEiOiJjbHFlbnZ5b3Mwa3JpMmtwZGRweG1pbm1jIn0.9e-ot28470a74r485-22sQ';

const MapComponent = ({ places, interactive = false, onPlaceSelect, style }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);

    useEffect(() => {
        if (map.current) return; // initialize map only once
        if (!places || places.length === 0) {
            console.log('No places to display on map');
            return;
        }

        console.log('Initializing map with', places.length, 'places');
        console.log('Map style:', style || 'mapbox://styles/mapbox/streets-v12');
        console.log('Mapbox token:', mapboxgl.accessToken ? 'Set' : 'Missing');

        const center = [places[0].Longitude || 77.2090, places[0].Latitude || 28.6139];

        try {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: style || 'mapbox://styles/mapbox/streets-v12',
                center: center,
                zoom: 11
            });

            map.current.on('load', () => {
                console.log('Map loaded successfully');
            });

            map.current.on('error', (e) => {
                console.error('Map error:', e);
            });

            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        } catch (error) {
            console.error('Failed to initialize map:', error);
        }
    }, [places, style]);

    useEffect(() => {
        if (!map.current || !places) return;

        // Clear existing markers
        const markers = document.getElementsByClassName('mapboxgl-marker');
        while (markers[0]) {
            markers[0].parentNode.removeChild(markers[0]);
        }

        // Add markers
        const bounds = new mapboxgl.LngLatBounds();

        places.forEach((place) => {
            if (!place.Longitude || !place.Latitude) return;

            const el = document.createElement('div');
            el.className = 'marker';
            el.style.backgroundImage = 'url(https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png)';
            el.style.width = '32px';
            el.style.height = '32px';
            el.style.backgroundSize = '100%';
            el.style.cursor = 'pointer';

            // Create marker
            const marker = new mapboxgl.Marker({ color: interactive ? '#FF5722' : '#3F51B5' })
                .setLngLat([place.Longitude, place.Latitude])
                .setPopup(
                    new mapboxgl.Popup({ offset: 25 })
                        .setHTML(
                            `<strong>${place.Name}</strong><br>
                             <span style="font-size:10px; color:gray">${place.Type}</span>`
                        )
                )
                .addTo(map.current);

            if (interactive && onPlaceSelect) {
                marker.getElement().addEventListener('click', () => {
                    onPlaceSelect(place);
                });
            }

            bounds.extend([place.Longitude, place.Latitude]);
        });

        if (places.length > 0) {
            map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
        }

        // Draw route if not interactive (i.e., itinerary view)
        if (!interactive && places.length > 1) {
            const coords = places.map(p => [p.Longitude, p.Latitude]).filter(c => c[0] && c[1]);

            if (map.current.getSource('route')) {
                map.current.getSource('route').setData({
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: coords
                    }
                });
            } else {
                map.current.on('load', () => {
                    map.current.addSource('route', {
                        'type': 'geojson',
                        'data': {
                            'type': 'Feature',
                            'properties': {},
                            'geometry': {
                                'type': 'LineString',
                                'coordinates': coords
                            }
                        }
                    });
                    map.current.addLayer({
                        'id': 'route',
                        'type': 'line',
                        'source': 'route',
                        'layout': {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        'paint': {
                            'line-color': '#888',
                            'line-width': 4
                        }
                    });
                });
            }
        }

    }, [places, interactive]);

    return (
        <div ref={mapContainer} className="w-full h-full rounded-xl shadow-inner" />
    );
};

export default MapComponent;
