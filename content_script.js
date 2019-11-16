//fire event to listen for url change events and action events

let uppercase = false;
let last_xpath = "";
let last_node = null;
let selector_enabled = false;


let close_recorder = function(){
  //hide parent element
  document.getElementById("qanairy_ide").style.display = "none";
  //reset localStorage
  localStorage.clear();
}

let logout = function(){
  localStorage.removeItem("authResult");
  close_recorder;
}

let pause = function(milliseconds) {
	var dt = new Date();
	while ((new Date()) - dt <= milliseconds) { /* Do nothing */ }
}

let recorderKeyupListener = function(event){

  chrome.runtime.sendMessage(
    {
      msg: "addToPath",
      data: {
        url: window.location.toString(),
        pathElement: {
          element: {
            type: "pageElement",
            target: event.relatedTarget,
            xpath: last_xpath
          },
          action: {
            type: "action",
            name: "sendKeys",
            value: last_node.value
          }
        }
      }
    },
    function(response) {
      //console.log("response ::  " +JSON.stringify(response));
    }
  );
}

let recorderKeydownListener = function(event){
  //check if shift key
  if(event.keyCode === 16){
    uppercase = !uppercase;
  }
  //check for caps lock key
  else if(event.keyCode === 20){
    uppercase = !uppercase;
  }
}

//generates x unique xpath for a given element
let generateXpath = function(elem){

  var xpath = "//"+elem.tagName.toLowerCase();
  var attributes = ["id", "name", "class"];
  var attributes_check = [];

  for(var idx=0; idx< attributes.length; idx++){
    if(elem.getAttribute(attributes[idx])){
      attributes_check.push("contains(@"+attributes[idx] +",'"+elem.getAttribute(attributes[idx])+"')");
    }
  }

  if(attributes_check.length > 0){
    xpath += "[";
    for(var idx1=0; idx1 < attributes_check.length; idx1++){
      xpath += attributes_check[idx1];
      if(idx1 < attributes_check.length-1){
        xpath += " and ";
      }
    }
    xpath += "]";
  }

  var elements = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
  var element = null;
  var count = 1;
  var indexed_xpath = "";
  while(element = elements.iterateNext()){
    if(element.tagName === elem.tagName
        && element.text === elem.text
        && element.innerHTML === elem.innerHTML){
          indexed_xpath = "("+xpath+")[" + count + "]";
          break;
    }
    count++;
  }

  if(count > 1){
    xpath = indexed_xpath;
  }

  return xpath;
}

/**
 * Traverses parent nodes in tree from current node toward root until it reaches the main html element or locates a z-Index value
 */
let findParentZIndex = function(node){

  var current_node = node;
  var z_index = null;
  while(current_node && (!z_index || !z_index.length || z_index === "auto")){
    z_index = document.defaultView.getComputedStyle(current_node).getPropertyValue("z-index");
    if(current_node.tagName === "HTML"){
      if(z_index === "auto"){
        return 0;
      }
    }

    current_node = current_node.parentNode;
  }

  return z_index;
}

let recorderClickListener = function(event){

  var xpath = "";
  var possible_nodes = [];
  var top_z_index = -10000;
  //get all elements on page
  document.querySelectorAll("body *").forEach(function(node){
    if(node.id !== "qanairy_ide_frame" && node.id !== "qanairy_ide_header" && node.id !== "qanairy_ide_body" && node.id !== "qanairy_ide"){
      var rect = node.getBoundingClientRect();
      if(event.clientX >= rect.left && event.clientY >= rect.top && event.clientX <= rect.right && event.clientY <= rect.bottom){
        possible_nodes.push(node);
      }
    }
  });

  for(var idx =0; idx < possible_nodes.length; idx++){
    var node = possible_nodes[idx];
    var rect = node.getBoundingClientRect();

    if(last_node != null){
      var z_index = findParentZIndex(possible_nodes[idx]);
      var rect2 = last_node.getBoundingClientRect();
      //smallest node
      if((rect2.left <= rect.left || rect2.top <= rect.top || rect2.right >= rect.right || rect2.bottom >= rect.bottom) && z_index >= top_z_index ){
        xpath = generateXpath(node);
        last_xpath = xpath;
        last_node = node;
        top_z_index = z_index;
      }
    }
    else{
      last_node = node;
    }
  }

	if(selector_enabled){
		event.preventDefault();
		event.stopPropagation();
		document.removeEventListener("click", recorderClickListener, true);
		chrome.runtime.sendMessage({msg: "setElementXpath", data: xpath});
		selector_enabled = false;
	}
	else if(xpath.length > 0){
    chrome.runtime.sendMessage(
        {
          msg: "addToPath",
          data: {
            url: window.location.toString(),
            pathElement: {
              element: {
                type: "pageElement",
                target: event.relatedTarget,
                xpath: xpath
              },
              action: {
                type: "action",
                name: "click",
                value: ""
             }
           }
         }
       },
       function(response) {
         //console.log("response ::  " +JSON.stringify(response));
       }
     );
   }
}

  //build list of elements where the x,y coords and height,width encompass the event x,y coords
  String.prototype.indexOfRegex = function(regex){
    var match = this.match(regex);
    return match ? this.indexOf(match[0]) : -1;
  }

	let executeTestElement = function(path_elem){
		if(path_elem !== undefined && path_elem.url){
			//if(path[idx].url !== window.location.toString()){
			window.location.href = path_elem.url;
			//Update the url here.
			chrome.runtime.sendMessage({
					msg: "redirect-tab",
					data: path_elem.url
			});
		}
		else if(path_elem && path_elem.element){
			var xpathResult = document.evaluate(path_elem.element.xpath, document, null, XPathResult.ANY_TYPE, null).iterateNext();
			//verify that element exists on page
			if(xpathResult){
				//perform action on element
				if(path_elem.action.name === "click"){
					xpathResult.click();
				}
				else if(path_elem.action.name === "doubleClick"){
					xpathResult.doubleClick();
				}
				else if(path_elem.action.name === "sendKeys"){
					xpathResult.value = path_elem.action.value;
				}
			}
		}
		else {
			//console.log("Unknown path element experienced");
		}
	}
  /*
   * Runs a test from beginning to end
   */
  let runTest = function(path){
    if(path.length && !path[0].url && localStorage.run_idx < path.length){
      alert("Paths must start with a page");
      return;
    }

    //process elements
		let test_interval = setInterval(function(){
			if(parseInt(localStorage.run_idx) >= path.length){
				clearInterval(test_interval);
				return;
			}
			executeTestElement(path[localStorage.run_idx]);
			localStorage.run_idx = parseInt(localStorage.run_idx, 10) + 1;
			localStorage.last_url = window.location.toString();
		}, 1000, path);

		if(localStorage.run_idx >= path.length){
			localStorage.status = "POST_RUN";
		}
  }

/**
 *
 * Make plugin frame draggable by using the header to drag frame around
 *
 */
let main = function(){
   // Make the DIV element draggable:
  function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    function closeDragElement() {
      // stop moving when mouse button is released:
      document.onmouseup = null;
      document.onmousemove = null;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    }

    if (document.getElementById(elmnt.id +"_header")) {
      // if present, the header is where you move the DIV from:
      document.getElementById(elmnt.id +"_header").onmousedown = dragMouseDown;
    } else {
      // otherwise, move the DIV from anywhere inside the DIV:
      elmnt.onmousedown = dragMouseDown;
    }
  }

  // Make the DIV element draggable:
  dragElement(document.getElementById("qanairy_ide"));
};

var open_recorder = function(){
  var elem = document.getElementById("qanairy_ide");
  if(!elem){
    renderRecorder();
    elem = document.getElementById("qanairy_ide");
  }
  elem.style.display = "block";
  main();
}

var renderRecorder = function(){
   var iframe = document.createElement("iframe");
   iframe.id="qanairy_ide_frame";
   iframe.style.cssText = "position:absolute;width:300px;height:550px;z-index:998";
   iframe.src = chrome.extension.getURL("/recorder.html");

   var header_inner_html = "<span id='ide_close_icon' onclick=\"document.getElementById('qanairy_ide').style.display='none';localStorage.removeItem('path');\" style='display:block;cursor:pointer;z-index:999;position:absolute;top:0px; left:280px;height:20px;width:20px;margin:0px;padding:0px;color:#FFFFFF'><b>x</b></span>";
   var header = document.createElement("div");
   header.style.cssText = "width:300px;height:20px;z-index:998;background-color:#553fc0;cursor:grab";
   header.id="qanairy_ide_header";
   header.innerHTML = header_inner_html;

   var body = document.createElement("div");
   body.style.cssText = "width:100%;height:20px";
   body.id="qanairy_ide_body";
   body.appendChild(iframe);

   var parent = document.createElement("div");
   parent.style.cssText = "position:absolute;width:300px;height:600px;z-index:10000;left:20px;top:20px;padding:0px";
   parent.id="qanairy_ide";
   parent.style.display = "none";
   parent.appendChild(header);
   parent.appendChild(body);
   document.body.appendChild(parent);
};

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.msg === "start_recording"){
      localStorage.status = "recording";

      document.addEventListener("click", recorderClickListener, true);
      document.addEventListener("keyup", recorderKeyupListener, true);
      document.addEventListener("keydown", recorderKeydownListener, true);

      sendResponse({status: "starting"});
    }
    else if (request.msg === "stop_recording") {
      localStorage.status = "stopped";

      document.removeEventListener("click", recorderClickListener, true);
      document.removeEventListener("keyup", recorderKeyupListener, true);
      document.removeEventListener("keydown", recorderKeydownListener, true);

      sendResponse({status: "stopping"});
    }
    else if(request.msg === "listen_for_element_selector"){
      selector_enabled = true;
      document.addEventListener("click", recorderClickListener, true);
    }
    else if (request.msg === "run_test"){
      localStorage.run_idx = 0;
      localStorage.status = "RUNNING";
      if(request.data){
        localStorage.path = JSON.stringify(request.data);
      }
			localStorage.setItem("last_url", window.location.toString());

			runTest(JSON.parse(localStorage.path));
    }
    else if (request.action === "open_recorder"){
      open_recorder();
    }
    else if (request.action === "close_recorder"){
      close_recorder();
    }
		else if (request.msg === "update_path"){
			localStorage.setItem("path", request.data);
		}
    return Promise.resolve("Dummy response to keep the console quiet");
});

renderRecorder();
main();
if(localStorage.status === "recording" || localStorage.status === "editing" || localStorage.status === "RUNNING" || localStorage.status === "POST_RUN"){
	document.getElementById("qanairy_ide").style.display = "block";
  if(localStorage.status === "editing"){
    //send path to recorder
    chrome.runtime.sendMessage({
        msg: "loadTest",
        data: localStorage.test
    });
    localStorage.removeItem(status);
  }
  else if(localStorage.status === "RUNNING"){
		open_recorder();
		runTest(JSON.parse(localStorage.path));
  }
	else if(localStorage.status === "POST_RUN"){
		localStorage.status = "";
	}
}


// Called sometime after postMessage is called
function receiveMessage(event)
{
  // Do we trust the sender of this message?
  if (event.origin.includes("localhost") || event.origin.includes("qanairy.com")){
    open_recorder();
		localStorage.test = JSON.stringify(JSON.parse(event.data).test);
		localStorage.path = JSON.stringify(JSON.parse(event.data).test.path);

		chrome.runtime.sendMessage({
        msg: "subscribe_to_platform",
        data: JSON.parse(event.data).profile
    });

    chrome.runtime.sendMessage({
        msg: "edit-test",
        data: JSON.parse(localStorage.test)
    });
    localStorage.removeItem(status);
  }

  // event.source is window.opener
  // event.data is "hello there!"

  // Assuming you've verified the origin of the received message (which
  // you must do in any case), a convenient idiom for replying to a
  // message is to call postMessage on event.source and provide
  // event.origin as the targetOrigin.
  //event.source.postMessage("hi there yourself!  the secret response " +
  //                         "is: rheeeeet!",
  //                         event.origin);
}

window.addEventListener("message", receiveMessage, false);
