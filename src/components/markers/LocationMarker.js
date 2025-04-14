import React from 'react';
import { Marker } from 'react-native-maps';
import DirectionArrow from '../../screens/DirectionArrow';

const LocationMarker = ({ location, heading }) => {
  if (!location) return null;

  return (
    <Marker 
      coordinate={location.coords} 
      flat 
      anchor={{ x: 0.5, y: 0.5 }} 
      rotation={heading}
      zIndex={1000}
    >
      <DirectionArrow heading={heading} />
    </Marker>
  );
};

export default LocationMarker;