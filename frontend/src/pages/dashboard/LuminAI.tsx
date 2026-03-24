import React from 'react';

const LuminAI = () => {
  return (
    <div style={{ width: '100%', height: 'calc(100vh - 120px)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
      <iframe 
        src="http://localhost:8002" 
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Lumin AI Bot Builder"
      />
    </div>
  );
};

export default LuminAI;
