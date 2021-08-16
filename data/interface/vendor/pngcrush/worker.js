{
	var WORKER = {
		"line": '',
		"getdata": function (e) {
			var data = FS.root.contents[e].contents;
		  return new Uint8Array(data).buffer;
		}
	};
	
	var Module = {
		"noFSInit" : true,
		"noInitialRun" : true,
		"preRun": function () {
			FS.init(function () {return null}, function (e) {
				if (e === 10) {
					postMessage({"type": "stdout", "line": WORKER.line});
					WORKER.line = '';
				} else {
					WORKER.line += String.fromCharCode(e);
				}
			});
		}
	};
	
	onmessage = async function (e) {
		if (e) {
			if (e.data) {
				if (e.data.type) {
					switch (e.data.type) {
						case "file":
							FS.createDataFile('/', "input.png", e.data.data, true, false);
							break;
						case "import":						
							if (e.data.path) {
								var response = await fetch(e.data.path + "pngcrush.js");
								var responsecode = await response.text();
								var responseblob = new Blob([responsecode], {"type": "text/javascript"});				
								importScripts(URL.createObjectURL(responseblob));
							} else {
								importScripts("pngcrush.js");
							}
							/*  */
							postMessage({"type": "ready"});
						case "command":
							if (e.data.command === "action") {
								postMessage({"type": "start"});
								Module.run(["-reduce", "-rem", "alla", "-rem", "text", "input.png", "output.png"]);
								postMessage({"type": "done", "data": WORKER.getdata("output.png")});
							}
						break;
					}
				}
			}
		}
	};
}
