import React from 'react';

/**
 * TacticalLayout Component
 * 
 * A high-level layout wrapper that provides consistent structure and background.
 */
function TacticalLayout({ children, header }) {
  return (
    <div className="app-container">
      {header}
      <main className="tactical-main">
        {children}
      </main>
      
      {/* Decorative tactical background element */}
      <div className="tactical-grid-overlay" />
    </div>
  );
}

export default TacticalLayout;
