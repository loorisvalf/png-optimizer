var optimizer = {
  "engines": {
    "compressor": function (file) {
      var action = function (e) {
        e.target.remove();
        /*  */
        new Compressor(file, {
          error (e) {},
          success (blob) {
            if (blob) {
              var output = document.getElementById("png-optimizer-item-id-" + blob.name);
              if (output) {
                var size = parseInt(output.getAttribute("size"));
                config.item.add.download.link(blob.name, blob);
                config.item.add.text(blob.name, ".progress", "100% ✔", "#679008");
                config.item.add.text(blob.name, ".final-size", config.size(blob.size));
                config.item.add.text(blob.name, ".percent", Math.floor(((blob.size - size) / size) * 100) + "%");
                config.console.element.textContent += blob.name + " >> " + "optimized image is ready for download" + "\n";
                /*  */
                config.console.element.scrollTop = config.console.element.scrollHeight || 0;
              }
            }
          }
        });
      };
      /*  */
      var script = document.createElement("script");
      script.src = chrome.runtime.getURL("/data/interface/vendor/compressor/compressor.js");
      document.body.appendChild(script);
      script.onload = action;
      /*  */
      config.item.add.template(file.name, file.size);
      config.item.add.text(file.name, ".name", file.name);
      config.item.add.text(file.name, ".original-size", config.size(file.size));
      config.item.add.text(file.name, ".progress", "optimizing in progress, please wait...");
      config.console.element.textContent += file.name + " >> " + "optimizing image..." + "\n";
    },
    "browser-image-compression": function (file) {
      var action = function (e) {
        e.target.remove();
        /*  */
        var context = document.documentElement.getAttribute("context");
        new imageCompression(file, {"useWebWorker": context === "webapp"}).then(function (blob) {
          var output = document.getElementById("png-optimizer-item-id-" + blob.name);
          if (output) {
            var size = parseInt(output.getAttribute("size"));
            config.item.add.download.link(blob.name, blob);
            config.item.add.text(blob.name, ".progress", "100% ✔", "#679008");
            config.item.add.text(blob.name, ".final-size", config.size(blob.size));
            config.item.add.text(blob.name, ".percent", Math.floor(((blob.size - size) / size) * 100) + "%");
            config.console.element.textContent += blob.name + " >> " + "optimized image is ready for download" + "\n";
            /*  */
            config.console.element.scrollTop = config.console.element.scrollHeight || 0;
          }
        });
      };
      /*  */
      var script = document.createElement("script");
      script.src = chrome.runtime.getURL("/data/interface/vendor/browser-image-compression/browser-image-compression.js");
      document.body.appendChild(script);
      script.onload = action;
      /*  */
      config.item.add.template(file.name, file.size);
      config.item.add.text(file.name, ".name", file.name);
      config.item.add.text(file.name, ".original-size", config.size(file.size));
      config.item.add.text(file.name, ".progress", "optimizing in progress, please wait...");
      config.console.element.textContent += file.name + " >> " + "optimizing image..." + "\n";
    },
    "pngcrush": function (file) {
      if (file.type !== "image/png") return;
      /*  */
      config.item.add.template(file.name, file.size);
      config.item.add.text(file.name, ".name", file.name);
      config.item.add.text(file.name, ".original-size", config.size(file.size));
      /*  */
      var reader = new FileReader();
      reader.name = file.name;
      reader.size = file.size;
      /*  */
      reader.readAsArrayBuffer(file);
      reader.addEventListener("load", async function (e) {
        var worker = null;
        var context = document.documentElement.getAttribute("context");
        var url = chrome.runtime.getURL("/data/interface/vendor/pngcrush/worker.js");
        /*  */
        if (context === "webapp") {
          var response = await fetch(url);
          var responsecode = await response.text();
          var responseblob = new Blob([responsecode], {"type": "text/javascript"});
          /*  */
          worker = new Worker(URL.createObjectURL(responseblob));        
          worker.postMessage({
            "type": "import", 
            "path": chrome.runtime.getURL("/data/interface/vendor/pngcrush/")
          });
        } else {
          worker = new Worker(url);        
          worker.postMessage({
            "path": '',
            "type": "import"
          });
        }
        /*  */
        worker.name = this.name;
        worker.size = this.size;
        worker.input = new Uint8Array(e.target.result);
        /*  */
        worker.onmessage = function (e) {
          if (e.data.type === "start") {
            config.console.element.textContent += '';
          } else if (e.data.type === "ready") {
            worker.postMessage({"type": "file", "data": this.input});
            worker.postMessage({"type": "command", "command": "action"});
          } else if (e.data.type === "stdout") {
            if (e.data.line.indexOf('| ') === -1) {
              config.item.add.text(this.name, ".progress", e.data.line);
              if (e.data.line) {
                config.console.element.textContent += this.name + " >> " + e.data.line + "\n";
              }
            }
          } else if (e.data.type === "done") {
            var blob = new Blob([e.data.data], {"type": "image/png"});
            /*  */
            config.item.add.download.link(this.name, blob);
            config.item.add.text(this.name, ".progress", "100% ✔", "#679008");
            config.item.add.text(this.name, ".final-size", config.size(blob.size));
            config.item.add.text(this.name, ".percent", Math.floor(((blob.size - this.size) / this.size) * 100) + "%");
            if (e.target) {
              e.target.terminate();
            }
          }
          /*  */
          config.console.element.scrollTop = config.console.element.scrollHeight || 0;
        };
      }, false);
    },
    "pngquant": function (file) {
      if (file.type !== "image/png") return;
      /*  */
      config.item.add.template(file.name, file.size);
      config.item.add.text(file.name, ".name", file.name);
      config.item.add.text(file.name, ".original-size", config.size(file.size));
      /*  */
      var reader = new FileReader();
      reader.name = file.name;
      reader.size = file.size;
      /*  */
      reader.readAsArrayBuffer(file);
      reader.addEventListener("load", async function (e) {
        var worker = null;
        var context = document.documentElement.getAttribute("context");
        var url = chrome.runtime.getURL("/data/interface/vendor/pngquant/worker.js");
        /*  */
        if (context === "webapp") {
          var response = await fetch(url);
          var responsecode = await response.text();
          var responseblob = new Blob([responsecode], {"type": "text/javascript"});
          /*  */
          worker = new Worker(URL.createObjectURL(responseblob));        
          worker.postMessage({
            "type": "import", 
            "path": chrome.runtime.getURL("/data/interface/vendor/pngquant/")
          });
        } else {
          worker = new Worker(url);        
          worker.postMessage({
            "path": '',
            "type": "import"
          });
        }
        /*  */
        worker.name = this.name;
        worker.size = this.size;
        worker.input = new Uint8Array(e.target.result);
        /*  */
        worker.onmessage = function (e) {
          if (e.data.type === "start") {
            config.console.element.textContent += '';
          } else if (e.data.type === "stdout") {
            config.item.add.text(this.name, ".progress", e.data.line);
            if (e.data.line) {
              config.console.element.textContent += this.name + " >> " + e.data.line + "\n";
            }
          } else if (e.data.type === "ready") {
            worker.postMessage({
              "arguments": {},
              "type": "command",
              "file": {
                "data": this.input,
                "name": "input.png"
              }
            });
          } else if (e.data.type === "done") {
            var blob = new Blob([e.data.data.data], {"type": "image/png"});
            /*  */
            config.item.add.download.link(this.name, blob);
            config.item.add.text(this.name, ".progress", "100% ✔", "#679008");
            config.item.add.text(this.name, ".final-size", config.size(blob.size));
            config.item.add.text(this.name, ".percent", Math.floor(((blob.size - this.size) / this.size) * 100) + "%");
            if (e.target) {
              e.target.terminate();
            }
          }
          /*  */
          config.console.element.scrollTop = config.console.element.scrollHeight || 0;
        };
      }, false);
    },
    "optipng": function (file) {
      if (file.type !== "image/png") return;
      /*  */
      config.item.add.template(file.name, file.size);
      config.item.add.text(file.name, ".name", file.name);
      config.item.add.text(file.name, ".original-size", config.size(file.size));
      /*  */
      var reader = new FileReader();
      reader.name = file.name;
      reader.size = file.size;
      /*  */
      reader.readAsArrayBuffer(file);
      reader.addEventListener("load", async function (e) {
        var worker = null;
        var context = document.documentElement.getAttribute("context");
        var url = chrome.runtime.getURL("/data/interface/vendor/optipng/worker.js");
        /*  */
        if (context === "webapp") {
          var response = await fetch(url);
          var responsecode = await response.text();
          var responseblob = new Blob([responsecode], {"type": "text/javascript"});
          /*  */
          worker = new Worker(URL.createObjectURL(responseblob));        
          worker.postMessage({
            "type": "import", 
            "path": chrome.runtime.getURL("/data/interface/vendor/optipng/")
          });
        } else {
          worker = new Worker(url);        
          worker.postMessage({
            "path": '',
            "type": "import"
          });
        }
        /*  */
        worker.name = this.name;
        worker.size = this.size;
        worker.input = new Uint8Array(e.target.result);
        /*  */
        worker.onmessage = function (e) {
          if (e.data.type === "start") {
            config.console.element.textContent += '';
          } else if (e.data.type === "stdout") {
            config.item.add.text(this.name, ".progress", e.data.line);
            if (e.data.line) {
              config.console.element.textContent += this.name + " >> " + e.data.line + "\n";
            }
          } else if (e.data.type === "ready") {
            worker.postMessage({
              "arguments": {},
              "type": "command",
              "file": {
                "data": this.input,
                "name": "input.png"
              }
            });
          } else if (e.data.type === "done") {
            var blob = new Blob([e.data.data.data], {"type": "image/png"});
            /*  */
            config.item.add.download.link(this.name, blob);
            config.item.add.text(this.name, ".progress", "100% ✔", "#679008");
            config.item.add.text(this.name, ".final-size", config.size(blob.size));
            config.item.add.text(this.name, ".percent", Math.floor(((blob.size - this.size) / this.size) * 100) + "%");
            if (e.target) {
              e.target.terminate();
            }
          }
          /*  */
          config.console.element.scrollTop = config.console.element.scrollHeight || 0;
        };
      }, false);
    }
  }
};