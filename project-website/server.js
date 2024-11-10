const express = require('express');
const path = require('path');


// const lib = require("../unicallJS/client/load")
// const stuff = {
  // "test.py": lib.loadPY("test.py")
// }



const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Route for the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post("/runlocal", (req, res) => {

  console.log(req.body.file)
  console.log(req.body.js)

  let obj = stuff[req.body.file]
  eval(req.body.js)
  

  res.json({ text: "hi" })
  
  
})




// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
