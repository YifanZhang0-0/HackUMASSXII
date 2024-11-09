//run 'python3 -m http.server 8000' from /project-website/public directory to get dynamic web interface
import React from 'react';
import ReactDOM from 'react-dom';
import './style.css';
import SmoothTitle from './components/smooth-title.jsx';

// script.js
function App() {
  return <SmoothTitle title="Welcome to Our Dope Ass Wedsite" />;
}

  // Render App component to the DOM
  ReactDOM.render(<App />, document.getElementById('root'));
  