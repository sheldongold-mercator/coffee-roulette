import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Coffee Roulette</h1>
        <p>Mercator IT Solutions - Employee Pairing Platform</p>
        <div style={{ marginTop: '2rem' }}>
          <p>Welcome to Coffee Roulette!</p>
          <p>The application is currently in development.</p>
          <div style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
            <p><strong>Features coming soon:</strong></p>
            <ul style={{ textAlign: 'left', display: 'inline-block' }}>
              <li>Microsoft OAuth Login</li>
              <li>Random Employee Pairing</li>
              <li>Automated Calendar Scheduling</li>
              <li>Teams Notifications</li>
              <li>Meeting Feedback & Tracking</li>
            </ul>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
