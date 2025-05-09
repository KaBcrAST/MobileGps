
export const formatValue = (value) => {
  if (!value) return '';
  
  if (typeof value === 'object') {
    if (value.text) return value.text;
    if (value.value) {
      if (value.value >= 60) return `${Math.round(value.value / 60)} min`;
      return `${value.value} s`;
    }
  }
  
  return value;
};

export const formatDistance = (distanceValue) => {
  if (!distanceValue) return '-- km';
  
  let dist;
  let unit = 'km';
  
  if (typeof distanceValue === 'object' && distanceValue.value) {
    dist = distanceValue.value / 1000;
  } else if (typeof distanceValue === 'number') {
    dist = distanceValue / 1000;
  } else if (typeof distanceValue === 'string') {
    return distanceValue;
  } else {
    return '-- km';
  }
  
  if (dist < 1) {
    dist = Math.round(dist * 1000);
    unit = 'm';
  } else {
    dist = Math.round(dist * 10) / 10;
  }
  
  return `${dist} ${unit}`;
};

export const getArrivalTime = (duration) => {
  if (!duration) return '--:--';
  
  const now = new Date();
  let durationInMinutes;
  
  if (typeof duration === 'object' && duration.value) {
    durationInMinutes = Math.round(duration.value / 60);
  } else if (typeof duration === 'string') {
    const match = duration.match(/(\d+)/);
    durationInMinutes = match ? parseInt(match[0], 10) : 0;
  } else if (typeof duration === 'number') {
    durationInMinutes = Math.round(duration / 60);
  } else {
    return '--:--';
  }
  
  const arrivalTime = new Date(now.getTime() + (durationInMinutes * 60 * 1000));

  return arrivalTime.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};