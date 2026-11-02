import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, MapPin, Play, Pause, RefreshCw, AlertTriangle, ShieldCheck, Navigation } from 'lucide-react';
import { djangoClient } from '../api/client';

// Custom Map Markers with SVG Icons to eliminate broken default Leaflet image paths
const createCustomIcon = (color, label) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background: ${color};
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 12px ${color}88;
        border: 2px solid #ffffff;
        font-weight: bold;
        font-size: 11px;
      ">
        ${label}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const truckIconLow = createCustomIcon('#10b981', '🚚');
const truckIconMed = createCustomIcon('#f59e0b', '🚚');
const truckIconHigh = createCustomIcon('#f43f5e', '⚠️');
const originIcon = createCustomIcon('#2563eb', 'A');
const destIcon = createCustomIcon('#8b5cf6', 'B');

function MapFocusHandler({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 6, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function LiveTracking() {
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [mapCenter, setMapCenter] = useState([39.8283, -98.5795]); // US geographical center
  const [mapZoom, setMapZoom] = useState(4);
  const [isSimulating, setIsSimulating] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLiveMapData = async () => {
    try {
      const res = await djangoClient.get('/api/shipments/map/all/');
      // Filter out shipments without valid coordinates
      const valid = res.data.filter((s) => s.origin_lat && s.origin_lng);
      setShipments(valid);
      if (valid.length > 0 && !selectedShipment) {
        setSelectedShipment(valid[0]);
        setMapCenter([valid[0].current_lat || valid[0].origin_lat, valid[0].current_lng || valid[0].origin_lng]);
        setMapZoom(6);
      }
    } catch (err) {
      console.warn('Failed to load map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveMapData();
  }, []);

  // GPS Simulation interval
  useEffect(() => {
    let interval = null;
    if (isSimulating) {
      interval = setInterval(() => {
        setShipments((prev) =>
          prev.map((s) => {
            if (s.status !== 'IN_TRANSIT' || !s.destination_lat) return s;
            const currentLat = s.current_lat || s.origin_lat;
            const currentLng = s.current_lng || s.origin_lng;
            // Move slightly towards destination (1.5% delta)
            const dLat = (s.destination_lat - currentLat) * 0.015;
            const dLng = (s.destination_lng - currentLng) * 0.015;
            return {
              ...s,
              current_lat: currentLat + dLat,
              current_lng: currentLng + dLng,
            };
          })
        );
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulating]);

  const handleSelectShipment = (s) => {
    setSelectedShipment(s);
    setMapCenter([s.current_lat || s.origin_lat, s.current_lng || s.origin_lng]);
    setMapZoom(7);
  };

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--header-height))', padding: '1.5rem' }}>
      {/* Title & Simulation Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
            Live Fleet Tracking & Geospatial Map
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Interactive OpenStreetMap telemetry, route polylines, and live GPS progression simulation
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`btn ${isSimulating ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: '0.4rem', fontSize: '0.85rem', background: isSimulating ? '#10b981' : undefined }}
          >
            {isSimulating ? <Pause size={14} /> : <Play size={14} />}
            {isSimulating ? 'Simulation Active' : 'Start GPS Simulation'}
          </button>
          <button onClick={fetchLiveMapData} className="btn btn-secondary" style={{ gap: '0.4rem', fontSize: '0.85rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Map + Sidebar Split View */}
      <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0 }}>
        {/* Active Shipments List Panel */}
        <div className="card" style={{ width: '320px', display: 'flex', flexDirection: 'column', padding: '1rem', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginBottom: '0.75rem' }}>
            Active Consignments ({shipments.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', flex: 1 }}>
            {shipments.map((s) => {
              const isSelected = selectedShipment?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => handleSelectShipment(s)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'rgba(37,99,235,0.2)' : 'var(--bg-primary)',
                    border: `1px solid ${isSelected ? '#38bdf8' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#38bdf8', fontSize: '0.8rem' }}>
                      {s.tracking_id}
                    </span>
                    <span className={`badge ${
                      s.delay_risk === 'HIGH' ? 'badge-danger' :
                      s.delay_risk === 'MEDIUM' ? 'badge-warning' : 'badge-success'
                    }`} style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                      {s.delay_risk || 'LOW'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 500 }}>
                    {s.sender_name} → {s.receiver_name}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    <span>{s.driver_name || 'Driver unassigned'}</span>
                    <span>{s.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leaflet Map Container */}
        <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', position: 'relative', borderRadius: 'var(--radius-lg)' }}>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ width: '100%', height: '100%', background: '#0b0f19' }}
          >
            <MapFocusHandler center={mapCenter} zoom={mapZoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {shipments.map((s) => {
              const currentPos = [s.current_lat || s.origin_lat, s.current_lng || s.origin_lng];
              const originPos = [s.origin_lat, s.origin_lng];
              const destPos = s.destination_lat ? [s.destination_lat, s.destination_lng] : null;

              const truckIcon = s.delay_risk === 'HIGH' ? truckIconHigh : s.delay_risk === 'MEDIUM' ? truckIconMed : truckIconLow;
              const polylineColor = s.delay_risk === 'HIGH' ? '#f43f5e' : s.delay_risk === 'MEDIUM' ? '#f59e0b' : '#38bdf8';

              return (
                <React.Fragment key={s.id}>
                  {/* Origin Marker */}
                  <Marker position={originPos} icon={originIcon}>
                    <Popup>
                      <div style={{ color: '#000', fontSize: '12px' }}>
                        <strong>Origin:</strong> {s.sender_name}
                      </div>
                    </Popup>
                  </Marker>

                  {/* Destination Marker */}
                  {destPos && (
                    <Marker position={destPos} icon={destIcon}>
                      <Popup>
                        <div style={{ color: '#000', fontSize: '12px' }}>
                          <strong>Destination:</strong> {s.receiver_name}
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Current Vehicle Position Marker */}
                  <Marker position={currentPos} icon={truckIcon}>
                    <Popup>
                      <div style={{ color: '#000', fontSize: '12px', minWidth: '160px' }}>
                        <div style={{ fontWeight: 'bold', color: '#2563eb' }}>{s.tracking_id}</div>
                        <div><strong>Driver:</strong> {s.driver_name || 'Unassigned'}</div>
                        <div><strong>Vehicle:</strong> {s.vehicle_reg || 'N/A'}</div>
                        <div><strong>Status:</strong> {s.status}</div>
                        <div><strong>Delay Risk:</strong> {s.delay_risk || 'LOW'}</div>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Route Polyline (Origin -> Current -> Destination) */}
                  {destPos && (
                    <Polyline
                      positions={[originPos, currentPos, destPos]}
                      color={polylineColor}
                      weight={4}
                      opacity={0.8}
                      dashArray={s.status === 'IN_TRANSIT' ? '6, 6' : undefined}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
