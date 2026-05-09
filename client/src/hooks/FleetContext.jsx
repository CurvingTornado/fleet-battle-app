import React, { createContext, useContext } from 'react';
import { useFleetState } from './useFleetState';

const FleetContext = createContext(null);

export const FleetProvider = ({ children }) => {
    const fleetState = useFleetState();
    return (
        <FleetContext.Provider value={fleetState}>
            {children}
        </FleetContext.Provider>
    );
};

export const useFleetContext = () => {
    const context = useContext(FleetContext);
    if (!context) {
        throw new Error("useFleetContext must be used within a FleetProvider");
    }
    return context;
};
