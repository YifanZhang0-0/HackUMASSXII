//run 'python3 -m http.server 8000' from /project-website/public directory to get dynamic web interface

// script.js
function App() {
    return (
      <div>
        <h2>Welcome to Our Dope Ass Website</h2>
        <p>This is where we showcase our amazing project!</p>
      </div>
    );
  }
  
  // Render App component to the DOM
  ReactDOM.render(<App />, document.getElementById('root'));
  