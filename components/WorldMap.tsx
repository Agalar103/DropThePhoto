
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { PhotoBox, Gender } from '../types';

interface WorldMapProps {
  boxes: PhotoBox[];
  onMapClick: (lat: number, lng: number) => void;
  onLongPress: (lat: number, lng: number) => void;
  onBoxClick: (box: PhotoBox) => void;
  userPos: [number, number] | null;
  isPremium: boolean;
}

const getBoxIcon = (gender: Gender) => {
  let color = '#ec4899'; // Varsayılan Pembe
  let shadowColor = '#ec4899';
  
  if (gender === 'Erkek') {
    color = '#3b82f6'; // Mavi
    shadowColor = '#3b82f6';
  } else if (gender === 'Kadın') {
    color = '#a855f7'; // Mor
    shadowColor = '#a855f7';
  } else if (gender === 'Trans') {
    color = '#000000'; // Siyah
    shadowColor = '#ffffff'; // Siyahın görünmesi için beyaz parlama
  }

  return new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border: 2px solid white; border-radius: 3px; box-shadow: 0 0 15px ${shadowColor};"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const userIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #22d3ee; width: 18px; height: 18px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 20px #22d3ee; animation: pulse 2s infinite;"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

const MapEvents = ({ onMapClick, onLongPress }: { onMapClick: (lat: number, lng: number) => void, onLongPress: (lat: number, lng: number) => void }) => {
  const timer = useRef<any>(null);

  useMapEvents({
    click: (e) => onMapClick(e.latlng.lat, e.latlng.lng),
    mousedown: (e) => {
      timer.current = setTimeout(() => {
        onLongPress(e.latlng.lat, e.latlng.lng);
      }, 800);
    },
    mouseup: () => {
      if (timer.current) clearTimeout(timer.current);
    },
    dragstart: () => {
      if (timer.current) clearTimeout(timer.current);
    }
  });
  return null;
};

const MapController = ({ pos }: { pos: [number, number] | null }) => {
  const map = useMap();
  
  useEffect(() => {
    setTimeout(() => { map.invalidateSize(); }, 200);
  }, [map]);

  useEffect(() => {
    if (pos) { map.flyTo(pos, 14, { duration: 1.5 }); }
  }, [pos, map]);
  
  return null;
};

const WorldMap: React.FC<WorldMapProps> = ({ boxes, onMapClick, onLongPress, onBoxClick, userPos, isPremium }) => {
  return (
    <div className="w-full h-full absolute inset-0 z-0">
      <MapContainer 
        center={[41.0082, 28.9784]} 
        zoom={13} 
        zoomControl={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer 
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          minZoom={2}
          maxZoom={18}
        />
        <MapEvents onMapClick={onMapClick} onLongPress={onLongPress} />
        <MapController pos={userPos} />
        
        {userPos && (
          <>
            <Marker position={userPos} icon={userIcon} />
            {!isPremium && (
              <Circle 
                center={userPos} 
                radius={20000} // 20km Şehir Sınırı Simülasyonu
                pathOptions={{ color: '#22d3ee', fillColor: '#22d3ee', fillOpacity: 0.05, weight: 1, dashArray: '5, 10' }} 
              />
            )}
          </>
        )}
        
        {boxes.map(box => (
          <Marker 
            key={box.id} 
            position={[box.lat, box.lng]} 
            icon={getBoxIcon(box.creator.gender)}
            eventHandlers={{ click: () => onBoxClick(box) }}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default WorldMap;
