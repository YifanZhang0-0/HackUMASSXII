function load() {

    for (func of functions) {
      this[func.name] = (...params) => {
        this.run(func.id, ...params)
      }
    }




    if (this.filetype == JS) {
      // Load JS file content
      const fileContent = readFileSync(this.filename);

      // Find global functions to add to this.functions
      for (const prop in globalThis) {
        if (typeof globalThis[prop] === 'function') {
          const func = new Function([], 'any', this.functions.length, prop);
          this.functions.push(func);
        }
      }

      console.log('Functions loaded:', this.functions.map(f => f.name));

    } else if (this.filetype == PY) {
      
    }
  }