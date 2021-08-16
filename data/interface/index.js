var background = (function () {
  var tmp = {};
  var context = document.documentElement.getAttribute("context");
  if (context === "webapp") {
    return {
      "send": function () {},
      "receive": function (callback) {}
    }
  } else {
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      for (var id in tmp) {
        if (tmp[id] && (typeof tmp[id] === "function")) {
          if (request.path === "background-to-interface") {
            if (request.method === id) tmp[id](request.data);
          }
        }
      }
    });
    /*  */
    return {
      "receive": function (id, callback) {tmp[id] = callback},
      "send": function (id, data) {chrome.runtime.sendMessage({"path": "interface-to-background", "method": id, "data": data})}
    }
  }
})();

var config  = {
  "drop": {"element": null},
  "select": {"element": null},
  "output": {"element": null},
  "result": {"element": null},
  "console": {"element": null},
  "optimize": {"element": null},
  "addon": {
    "homepage": function () {
      return chrome.runtime.getManifest().homepage_url;
    }
  },
  "size": function (s) {
    if (s) {
      if (s >= Math.pow(2, 30)) {return (s / Math.pow(2, 30)).toFixed(1) + " GB"};
      if (s >= Math.pow(2, 20)) {return (s / Math.pow(2, 20)).toFixed(1) + " MB"};
      if (s >= Math.pow(2, 10)) {return (s / Math.pow(2, 10)).toFixed(1) + " KB"};
      return s + " B";
    } else return '';
  },
  "resize": {
    "timeout": null,
    "method": function () {
      if (config.resize.timeout) window.clearTimeout(config.resize.timeout);
      config.resize.timeout = window.setTimeout(function () {
        config.storage.write("size", {
          "width": window.innerWidth || window.outerWidth,
          "height": window.innerHeight || window.outerHeight
        });
      }, 1000);
    }
  },
  "load": function () {
    var reload = document.getElementById("reload");
    var support = document.getElementById("support");
    var donation = document.getElementById("donation");
    /*  */
    reload.addEventListener("click", function () {
      document.location.reload();
    }, false);
    /*  */
    support.addEventListener("click", function () {
      var url = config.addon.homepage();
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    donation.addEventListener("click", function () {
      var url = config.addon.homepage() + "?reason=support";
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    config.storage.load(config.app.start);
    window.removeEventListener("load", config.load, false);
  },
  "storage": {
    "local": {},
    "read": function (id) {
      return config.storage.local[id];
    },
    "load": function (callback) {
      chrome.storage.local.get(null, function (e) {
        config.storage.local = e;
        callback();
      });
    },
    "write": function (id, data) {
      if (id) {
        if (data !== '' && data !== null && data !== undefined) {
          var tmp = {};
          tmp[id] = data;
          config.storage.local[id] = data;
          chrome.storage.local.set(tmp, function () {});
        } else {
          delete config.storage.local[id];
          chrome.storage.local.remove(id, function () {});
        }
      }
    }
  },
  "port": {
    "name": '',
    "connect": function () {
      config.port.name = "webapp";
      var context = document.documentElement.getAttribute("context");
      /*  */
      if (chrome.runtime) {
        if (chrome.runtime.connect) {
          if (context !== config.port.name) {
            if (document.location.search === "?tab") config.port.name = "tab";
            if (document.location.search === "?win") config.port.name = "win";
            if (document.location.search === "?popup") config.port.name = "popup";
            /*  */
            if (config.port.name === "popup") {
              document.body.style.width = "700px";
              document.body.style.height = "500px";
            }
            /*  */
            chrome.runtime.connect({
              "name": config.port.name
            });
          }
        }
      }
      /*  */
      document.documentElement.setAttribute("context", config.port.name);
    }
  },
  "item": {
    "add": {
      "text": function (name, key, text, color) {
        if (name && key && text) {
          var output = document.getElementById("png-optimizer-item-id-" + name);
          if (output) {
            var target = output.querySelector(key);
            if (target) {
              target.textContent = text.trim();
              if (color) target.style.color = color;
            }
          }
        }
      },
      "template": function (name, size) {
        var output = document.getElementById("png-optimizer-item-id-" + name);
        if (!output) {
          var template = document.querySelector("template");
          var parent = template.content.querySelector(".output");
          output = document.importNode(parent, true);
          output.setAttribute("id", "png-optimizer-item-id-" + name);
          output.setAttribute("name", name);
          output.setAttribute("size", size);
          config.result.element.appendChild(output);
        }
      },
      "download": {
        "link": function (name, blob) {
          var output = document.getElementById("png-optimizer-item-id-" + name);
          if (output) {
            var a = document.createElement("a");
            var download = output.querySelector(".download");
            /*  */
            a.href = window.URL.createObjectURL(blob);
            a.download = name;
            a.textContent = '↓';
            download.setAttribute("title", "Download");
            download.appendChild(a);
          }
        }
      }
    }
  },
  "app": {
    "clean": function (d, r, c) {
      var index = config.select.element.selectedIndex;
      var title = config.select.element[index].textContent || "Compressor";
      /*  */
      if (d) config.drop.element.value = '';
      if (r) config.result.element.textContent = '';
      if (c) {
        config.console.element.textContent = "PNG Optimizer is ready!\n";
        config.console.element.textContent += "Selected optimization engine: " + title + "\n";
        config.console.element.textContent += "To start, please drop a .png file(s) in the above area." + "\n" + "\n";
      }
      /*  */
      config.resize.method();
    },
    "optimize": function () {
      var files = config.drop.element.files;
      if (files && files.length) {
        config.console.element.textContent += "Starting optimization process, please wait..." + "\n" + "\n";
        window.setTimeout(function () {
          var index = config.select.element.selectedIndex;
          var name = config.select.element[index].value || "compressor";
          for (var i = 0; i < files.length; i++) {
            var file = files[i];
            optimizer.engines[name](file);
          }
          /*  */
          config.console.element.textContent += "\n";
          config.console.element.scrollTop = config.console.element.scrollHeight || 0;
        }, 700);
      }
    },
    "start": function () {
      config.drop.element = document.getElementById("fileio");
      config.result.element = document.querySelector(".result");
      config.select.element = document.getElementById("selector");
      config.console.element = document.getElementById("console");
      config.optimize.element = document.getElementById("optimize");
      /*  */
      config.select.element.selectedIndex = config.storage.read("selected-index") !== undefined ? config.storage.read("selected-index") : 0;
      /*  */
      config.optimize.element.addEventListener("click", function () {
        config.app.clean(false, true, true);
        config.app.optimize();
      });
      /*  */
      config.drop.element.addEventListener("change", function (e) {
        config.app.clean(false, false, true);
        config.app.optimize();
      }, false);
      /*  */
      config.select.element.addEventListener("change", function (e) {
        config.storage.write("selected-index", e.target.selectedIndex);
        config.app.clean(false, true, true);
        config.app.optimize();
      }, false);
      /*  */
      config.app.clean(true, true, true);
    }
  }
};

config.port.connect();

window.addEventListener("load", config.load, false);
window.addEventListener("resize", config.resize.method, false);
window.addEventListener("dragover", function (e) {e.preventDefault()});
window.addEventListener("drop", function (e) {if (e.target.id !== "fileio") e.preventDefault()});
