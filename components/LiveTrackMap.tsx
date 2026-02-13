import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, User } from 'lucide-react';

interface Location {
    lat: number;
    lng: number;
    address?: string;
}

interface LiveTrackMapProps {
    customerLocation: Location;
    providerLocation: Location;
    providerName: string;
    serviceName: string;
}

const LiveTrackMap: React.FC<LiveTrackMapProps> = ({
    customerLocation,
    providerLocation,
    providerName,
    serviceName
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [providerMarker, setProviderMarker] = useState<google.maps.Marker | null>(null);
    const [eta, setEta] = useState<string>('Calculated...');
    const [currentProviderLocation, setCurrentProviderLocation] = useState(providerLocation);

    // Initialize Map
    useEffect(() => {
        if (!mapRef.current || !window.google) return;

        const mapInstance = new window.google.maps.Map(mapRef.current, {
            center: customerLocation,
            zoom: 14,
            styles: [
                {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }],
                },
            ],
            disableDefaultUI: true,
            zoomControl: true,
        });

        // Customer Marker (Static)
        new window.google.maps.Marker({
            position: customerLocation,
            map: mapInstance,
            icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#4f46e5",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
            },
            title: "Your Location",
        });

        // Provider Marker (Dynamic)
        const pMarker = new window.google.maps.Marker({
            position: providerLocation,
            map: mapInstance,
            label: {
                text: "P",
                color: "white",
                fontWeight: "bold"
            },
            icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: "#10b981", // Emerald green
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
            },
            title: providerName,
        });

        setMap(mapInstance);
        setProviderMarker(pMarker);

        // Fit bounds to show both
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(customerLocation);
        bounds.extend(providerLocation);
        mapInstance.fitBounds(bounds);

        // Simulate Movement
        const steps = 100;
        let step = 0;
        const interval = setInterval(() => {
            step++;
            if (step > steps) {
                clearInterval(interval);
                setEta('Arrived');
                return;
            }

            // Linear interpolation for simulation
            const lat = providerLocation.lat + (customerLocation.lat - providerLocation.lat) * (step / steps);
            const lng = providerLocation.lng + (customerLocation.lng - providerLocation.lng) * (step / steps);

            const newPos = { lat, lng };
            setCurrentProviderLocation(newPos);

            if (pMarker) {
                pMarker.setPosition(newPos);
            }

            // Update ETA
            const distance = Math.sqrt(
                Math.pow(customerLocation.lat - lat, 2) + Math.pow(customerLocation.lng - lng, 2)
            );
            // Rough validation: 0.01 degrees is approx 1.1km
            const minutesRemaining = Math.max(0, Math.round(distance * 100 * 2)); // Fake calculation
            setEta(`${minutesRemaining} mins`);

        }, 1000); // Update every second

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-slate-200">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-slate-900">{serviceName}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                        <User className="w-3 h-3" /> {providerName} is on the way
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">ETA</div>
                    <div className="text-xl font-bold text-indigo-600">{eta}</div>
                </div>
            </div>

            <div ref={mapRef} className="w-full h-[400px] bg-slate-100" />

            <div className="p-4 flex gap-4 text-sm bg-white">
                <div className="flex-1 flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Destination</p>
                        <p className="font-medium text-slate-900 line-clamp-1">{customerLocation.address || 'Your Location'}</p>
                    </div>
                </div>
                <div className="flex-1 flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Navigation className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Status</p>
                        <p className="font-medium text-slate-900">{eta === 'Arrived' ? 'Provider Arrived' : 'En Route'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveTrackMap;
