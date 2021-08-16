{
  var print = function (text) {
    postMessage({"type": "stdout", "line": text});
  };
  
	onmessage = async function (e) {
		if (e) {
			if (e.data) {
				if (e.data.type) {
					switch (e.data.type) {
						case "import":
							if (e.data.path) {
								var response = await fetch(e.data.path + "pngquant.js");
								var responsecode = await response.text();
								var responseblob = new Blob([responsecode], {"type": "text/javascript"});				
								importScripts(URL.createObjectURL(responseblob));
							} else {
								importScripts("pngquant.js");
							}
							/*  */
							postMessage({"type": "ready"});
						case "command":            
              var Module = {
                "print": print,
                "printErr": print,
                "file": e.data.file || {},
                "arguments": e.data.arguments || [],
                "data": e.data.file ? e.data.file.data : null
              };
              /*  */
              postMessage({"type": "start", "data": JSON.stringify(Module.arguments)});
              postMessage({"type": "stdout", "line": "Received command: " + (Module.arguments.length ? JSON.stringify(Module.arguments) : "N/A")});
              /*  */
              if (Module.data) {
                var time = Date.now();
                var result = pngquant(Module.data, Module.arguments, print);
                var totalTime = Date.now() - time;
                /*  */
                postMessage({"type": "stdout", "line": "Finished processing (took " + totalTime + "ms)"});
                postMessage({"type": "done", "data": result, "time": totalTime});
              }
						break;
					}
				}
			}
		}
	};
}