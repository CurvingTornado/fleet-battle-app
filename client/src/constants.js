/**
 * Fleet Command Constants & Configuration
 * 
 * Centralized registry for ships, initial states, and tactical metadata.
 */

/**
 * Registry of all available vessels grouped by Rate.
 */
export const SHIP_REGISTRY = {
  "Rate 1": ["12 Apostolov", "Victory", "La Royale", "Santisima Trinidad", "Huracan"],
  "Rate 2": ["Ingermanland", "Sans Pareil", "Redoutable", "Adventure", "Octopus", "St. Pavel", "Firestorm", "Neptuno", "Vasa", "Montanes"],
  "Rate 3": ["Poltava", "Anson", "Bellona", "Kobukson", "Deadfish", "Le Saint Louis", "Azov", "Iberia", "Shen"],
  "Rate 4": ["Surprise", "Essex", "Constitution", "Devourer", "Red Arrow", "Sparrow", "Three Hierarchs", "Flying Cloud"],
  "Rate 5": ["La Creole", "Black Wind", "San Martin", "La Requin", "Black Prince", "Eagle", "Axel Thorson", "Kwee Song", "Southhampton"],
  "Rate 6": ["Le Serf", "La Salamandre", "Phoenix", "Polacca", "Balloon", "Savannah", "Golden Apostle", "Shunsen"],
  "Rate 7": ["Pickle", "Horizont", "Friede"]
};

/**
 * Initial configuration for squadrons when a new operation is initialized.
 */
export const INITIAL_SQUADRONS = {
    "Vanguard": { name: "Vanguard", active: true, formation: "Line Ahead", players: [] },
    "Center/Main Body": { name: "Center/Main Body", active: true, formation: "Line Ahead", players: [] },
    "Rear": { name: "Rear", active: true, formation: "Line Ahead", players: [] },
    "Screen": { name: "Screen", active: true, formation: "Line Ahead", players: [] },
    "Reserve": { name: "Reserve", active: true, formation: "Line Ahead", players: [] }
};

/**
 * Standard ship specialties/builds.
 */
export const SHIP_BUILDS = ["Standard", "Brawler", "Boarder", "Sniper"];

/**
 * Standard tactical formations.
 */
export const FORMATIONS = ["Line Ahead", "Line Abreast", "Echelon Left", "Echelon Right"];

/**
 * Simulated players for Sandbox/Playground mode testing.
 */
export const FAKE_PLAYERS = [
    { id: 'fake_1', name: 'CAPT. AUBREY', tag: 'HMS', status: 'online', offers: ['HMS VICTORY (1ST)', 'HMS AGAMEMNON (3RD)', 'HMS SURPRISE (FRIGATE)'], ship: 'HMS VICTORY (1ST)', selected: true, role: 'Member' },
    { id: 'fake_2', name: 'CMDR. PULLINGS', tag: 'HMS', status: 'online', offers: ['HMS SURPRISE (FRIGATE)', 'HMS SOPHIE (BRIG)'], ship: 'HMS SURPRISE (FRIGATE)', selected: true, role: 'Member' },
    { id: 'fake_3', name: 'LT. MOWETT', tag: 'HMS', status: 'online', offers: ['HMS SURPRISE (FRIGATE)'], ship: '', selected: true, role: 'Member' },
    { id: 'fake_4', name: 'CAPT. HORNBLOWER', tag: 'HMS', status: 'online', offers: ['HMS SUTHERLAND (3RD)', 'HMS INDEFATIGABLE (FRIGATE)', 'HMS WITCH OF ENDOR'], ship: 'HMS SUTHERLAND (3RD)', selected: true, role: 'Member' },
    { id: 'fake_5', name: 'LT. BUSH', tag: 'HMS', status: 'online', offers: ['HMS SUTHERLAND (3RD)'], ship: '', selected: true, role: 'Member' },
    { id: 'fake_6', name: 'ADM. NELSON', tag: 'HMS', status: 'online', offers: ['HMS VICTORY (1ST)'], ship: 'HMS VICTORY (1ST)', selected: true, role: 'Member' },
    { id: 'fake_7', name: 'CAPT. HARDY', tag: 'HMS', status: 'online', offers: ['HMS VICTORY (1ST)'], ship: '', selected: true, role: 'Member' },
    { id: 'fake_8', name: 'CAPT. COLLINGWOOD', tag: 'HMS', status: 'online', offers: ['HMS ROYAL SOVEREIGN (1ST)'], ship: 'HMS ROYAL SOVEREIGN (1ST)', selected: true, role: 'Member' },
    { id: 'fake_9', name: 'CAPT. DE SAUMAREZ', tag: 'HMS', status: 'online', offers: ['HMS ORION (3RD)'], ship: 'HMS ORION (3RD)', selected: true, role: 'Member' },
    { id: 'fake_10', name: 'CAPT. TROUBRIDGE', tag: 'HMS', status: 'online', offers: ['HMS CULLODEN (3RD)'], ship: 'HMS CULLODEN (3RD)', selected: true, role: 'Member' },
    { id: 'fake_11', name: 'CAPT. BALL', tag: 'HMS', status: 'online', offers: ['HMS ALEXANDER (3RD)'], ship: '', selected: true, role: 'Member' },
    { id: 'fake_12', name: 'CAPT. HOOD', tag: 'HMS', status: 'online', offers: ['HMS ZEALOUS (3RD)'], ship: '', selected: true, role: 'Member' },
    { id: 'fake_13', name: 'CAPT. FOLEY', tag: 'HMS', status: 'online', offers: ['HMS GOLIATH (3RD)'], ship: '', selected: true, role: 'Member' },
    { id: 'fake_14', name: 'CAPT. MILLER', tag: 'HMS', status: 'online', offers: ['HMS THESEUS (3RD)'], ship: '', selected: true, role: 'Member' },
    { id: 'fake_15', name: 'CAPT. BERRY', tag: 'HMS', status: 'online', offers: ['HMS VANGUARD (3RD)'], ship: '', selected: true, role: 'Member' },
];

/**
 * Maps a ship name to its corresponding tactical rate icon.
 * @param {string} shipName - Name of the vessel
 * @returns {string} - Filename of the rate icon
 */
export const getShipIcon = (shipName) => {
  if (!shipName) return 'rate7.png';
  let nameUpper = shipName.toUpperCase();
  
  // Strip build suffixes like (Brawler), (Sniper), etc. for base identification
  const baseName = nameUpper.split(' (')[0];
  
  if (nameUpper.includes('(1ST)')) return 'rate1.png';
  if (nameUpper.includes('(2ND)')) return 'rate2.png';
  if (nameUpper.includes('(3RD)')) return 'rate3.png';
  if (nameUpper.includes('(4TH)')) return 'rate4.png';
  if (nameUpper.includes('(5TH)')) return 'rate5.png';
  if (nameUpper.includes('(6TH)')) return 'rate6.png';
  if (nameUpper.includes('(7TH)')) return 'rate7.png';
  
  for (const [rate, ships] of Object.entries(SHIP_REGISTRY)) {
    if (ships.some(s => s.toUpperCase() === baseName)) {
      const rateNum = rate.split(' ')[1];
      return `rate${rateNum}.png`;
    }
  }
  return 'rate7.png';
};
