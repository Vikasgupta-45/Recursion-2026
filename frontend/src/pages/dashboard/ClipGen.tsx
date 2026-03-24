import React from 'react';
import { Film } from 'lucide-react';

const ClipGen = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ padding: 10, background: 'rgba(168,130,255,0.12)', borderRadius: 12 }}><Film size={24} color="#a882ff" /></div>
        <div>
          <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Video Clipper</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Generate viral clips from your YouTube videos with AI</p>
        </div>
      </header>
      <div style={{ width: '100%', height: 'calc(100vh - 200px)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
        <iframe 
          src="http://localhost:8001" 
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Viking Clip Generator"
        />
      </div>
    </div>
  );
};

export default ClipGen;
