const express = require('express');
const path = require('path');

onedef = undefined 
stuff = {};

(async () => {
onedef = await import("../onedefJS/client/load.mjs")
stuff["test.py"]=await onedef.loadPY("test.py")
console.log("test loaded")
stuff["llm.py"]=await onedef.loadPY("llm.py")
console.log("llm loaded")
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

  console.log("running js", req.body.file, req.body.js)
  let output = []
  let obj=stuff[req.body.file]
  console.log(obj)
  let _log = console.log
  console.log = (...a) => {
    _log(a)
    output.push(a.join(" "));
  }
  try {
    eval(`(async()=>{try{${req.body.js}}catch(e){console.log=_log;res.json({text:e.toString()})};console.log=_log;res.json({ text: output.join("\\n") })})();`);
  }
  catch (e) {
    res.json({ text: e.toString() })
  }
})



// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
