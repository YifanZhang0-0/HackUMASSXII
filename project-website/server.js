const express = require('express');
const path = require('path');

onedef = undefined 
stuff = {};

(async () => {
onedef = await import("../onedefJS/client/load.mjs")
stuff["test.py"]=await onedef.loadPY("test.py")
console.log(stuff["test.py"])
// stuff["llm.py"]=await onedef.loadPY("llm.py")
// console.log(stuff["llm.py"])
})();



const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Route for the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post("/runlocal", async function (req, res) {

  console.log("running js")
  let output = []
  let obj=stuff[req.body.file]
  let _log = console.log
  console.log = (...a) => {
    _log(a)
    output.push(a.join(" "));
  }
  eval(`(async () => {${req.body.js}; console.log=_log; res.json({ text: output.join(" ") })})();`);
})



// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
