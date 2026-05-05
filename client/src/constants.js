export const SHIP_REGISTRY = {
  "Rate 1": ["12 Apostolov", "Victory", "La Royale", "Santisima Trinidad", "Huracan"],
  "Rate 2": ["Ingermanland", "Sans Pareil", "Redoutable", "Adventure", "Octopus", "St. Pavel", "Firestorm", "Neptuno", "Vasa", "Montanes"],
  "Rate 3": ["Poltava", "Anson", "Bellona", "Kobukson", "Deadfish", "Le Saint Louis", "Azov", "Iberia", "Shen"],
  "Rate 4": ["Surprise", "Essex", "Constitution", "Devourer", "Red Arrow", "Sparrow", "Three Hierarchs", "Flying Cloud"],
  "Rate 5": ["La Creole", "Black Wind", "San Martin", "La Requin", "Black Prince", "Eagle", "Axel Thorson", "Kwee Song", "Southhampton"],
  "Rate 6": ["Le Serf", "La Salamandre", "Phoenix", "Polacca", "Balloon", "Savannah", "Golden Apostle", "Shunsen"],
  "Rate 7": ["Pickle", "Horizont", "Friede"]
};

export const getShipIcon = (shipName) => {
  if (!shipName) return 'rate7.png';
  const nameUpper = shipName.toUpperCase();
  
  if (nameUpper.includes('(1ST)')) return 'rate1.png';
  if (nameUpper.includes('(2ND)')) return 'rate2.png';
  if (nameUpper.includes('(3RD)')) return 'rate3.png';
  if (nameUpper.includes('(4TH)')) return 'rate4.png';
  if (nameUpper.includes('(5TH)')) return 'rate5.png';
  if (nameUpper.includes('(6TH)')) return 'rate6.png';
  if (nameUpper.includes('(7TH)')) return 'rate7.png';
  
  for (const [rate, ships] of Object.entries(SHIP_REGISTRY)) {
    if (ships.some(s => s.toUpperCase() === nameUpper)) {
      const rateNum = rate.split(' ')[1];
      return `rate${rateNum}.png`;
    }
  }
  return 'rate7.png';
};
