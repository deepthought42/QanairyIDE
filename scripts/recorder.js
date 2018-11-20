let $jquery = jQuery.noConflict();

let startRecording = document.getElementById("startRecording");
let stopRecording = document.getElementById("stopRecording");
let pageEditPanel = document.getElementById("pageForm");
let pageElementEditPanel = document.getElementById("pageElementForm");
let selector_status = "disabled";
let recording_status = "stopped";

$jquery(document).ready(function(){
  var path = JSON.parse(localStorage.getItem("path"));
  if(path){
    redrawPath(path);
  }
});

$jquery("#createNewTest").on("click", function(){
  localStorage.setItem("path", JSON.stringify([]));
  $jquery("#test_path_viewer").html("");
});

$jquery(".deleteIcon").on("click", function(e){
  conosle.log("delete icons and stuff");
  console.log("delete icon clicked");
  var path = JSON.parse(localStorage.getItem(path));
  deletePathElement(path);
});

//handle clicking on button for adding custom page element<->action pairs to path
$jquery("#createPageElementButton").on("click", function(){
  $jquery("#pageElementXpath").val("");
  $jquery("actionName").val("");
  $jquery("#actionValue").val("");
  $jquery("#pageElementIndexInPath").val("");

  pageEditPanel.style.display = "none";
  pageElementEditPanel.style.display = "block";
  $jquery("#pageElementIndexInPath").val("");
});

/*saves a page element by either updateing it if the index is set, otherwise
 * creating a new page element action set and appending the set to the end of
 * the path stored in localhost
*/
$jquery("#savePageElementButton").on("click", function(){
  var element_action = {
    element: {
      xpath: $jquery("#pageElementXpath").val()
    },
    action :{
      name : $jquery("actionName").val(),
      value: $jquery("#actionValue").val()
    }
  }

  var path = JSON.parse(localStorage.path);
  var index = $jquery("#pageElementIndexInPath").val();
  if(index && index.length > 0){
    path[ index ] = element_action;
    redrawPathElement(element_action, index);
  }
  else {
    path.push(element_action);
    $jquery("#test_path_viewer").append( generatePageElementPathListItem(element_action, path.length-1 ));
  }
  localStorage.setItem("path", JSON.stringify(path));

  //reset page element <-> action form fields
   $jquery("#pageElementXpath").val(null);
   $jquery("actionName").val(null);
   $jquery("#actionValue").val(null);
   $jquery("#pageElementIndexInPath").val(null);
});

/*saves a page by either updateing it if the index is set, otherwise
 * creating a new page and appending it to the end of
 * the path stored in localhost
*/
$jquery("#savePageButton").on("click", function(){
  var page = {
    url: $jquery("#pageUrl").val()
  }

  var path = JSON.parse(localStorage.path);
  var index = $jquery("#pageIndexInPath").val();
  if(index && index.length > 0){
    path[ index ] = page;
    redrawPathElement(page, index);
  }
  else {
    path.push(page);
    $jquery("#test_path_viewer").append( generatePagePathListItem(page, path.length-1 ));
  }
  localStorage.setItem("path", JSON.stringify(path));

  //reset page form fields
  $jquery("#pageIndexInPath").val(null);
  $jquery("#pageUrl").val(null);
});

/*
 * Handles clicks on path elements and routes to the proper form and functionality based on
 * which path element is clicked on.
 */
$jquery("#test_path_viewer").on("click", ".path-element", function(){
    //send element to path element form
    var index = $jquery(this).data("index");
    var element = JSON.parse(localStorage.getItem("path"))[index];

    if(element.element){
      //send to path element form
      $jquery("#pageElementXpath").val(element.element.xpath);
      $jquery("actionName").val(element.action.name);
      $jquery("#actionValue").val(element.action.value);
      $jquery("#pageElementIndexInPath").val(index);
      pageEditPanel.style.display = "none";
      pageElementEditPanel.style.display = "block";
    }
    else if(element.url){
      //send to path element form
      $jquery("#pageUrl").val(element.url);
      pageEditPanel.style.display = "block";
      pageElementEditPanel.style.display = "none";
    }

  });

pageEditPanel.style.display = "none";
pageElementEditPanel.style.display = "block";
startRecording.style.display = "block";
stopRecording.style.display = "none";

//start recording user interaction
startRecording.onclick = function(element) {
  stopRecording.style.display = "block";
  startRecording.style.display = "none";

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    chrome.tabs.sendMessage(tabs[0].id, {msg: "start_recording", data: {}}, function(response) {
      recording_status = "started";
    });
  });
};

//Stop recording user interactions
stopRecording.onclick = function(element){
  stopRecording.style.display = "none";
  startRecording.style.display = "block";

  //fire event to stop listening for url change events and action events
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    chrome.tabs.sendMessage(tabs[0].id, {msg: "stop_recording"}, function(response) {
      recording_status = "stopped";
    });
  });
};

$jquery("#runTestButton").on("click", function(element){
  var path = JSON.parse(localStorage.getItem("path"));
  //send path to content script to be ran

/*  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    chrome.tabs.sendMessage(tabs[0].id, {msg: "run_test", data: path}, function(response) {
      console.log("Test run request received response  ::  "+JSON.stringify(response));
    });
  });
  */
  chrome.runtime.sendMessage({msg: "start_test_run", data: path}, function(response) {
    console.log("Test run request received response  ::  "+JSON.stringify(response));
  });
});

/*
 *  Exports a test to the Qanairy platform. Before allowing export, it requires
 *  the user to input a name for the created test
 *
 */
$jquery("#exportTest").on("click", function(element){
    var path = JSON.parse(localStorage.getItem("path"));
    console.log("Initiating export");
    alert("Please name your test");
    //****************************************
    //test path export code
    //****************************************
    var xhr = new XMLHttpRequest();
    //xhr.open("POST", "https://api.qanairy.com/testIDE", true);
    xhr.open("POST", "http://localhost:9080/testIDE", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onload = function() {
      console.log("xhr  : : "+xhr);
      console.log("onloaded stuff  "+JSON.parse(xhr));

      console.log("onloaded stuff  "+JSON.parse(xhr.responseText));
      if (xhr.readyState === 4) {
        // JSON.parse does not evaluate the attacker's scripts.
        var resp = JSON.parse(xhr.responseText);
        //document.getElementById("resp").innerText = xhr.responseText;
      }
    }
    xhr.send(JSON.stringify({name: "test testing", path: path}));
});

/*
 * Shows page creation form when button is clicked
 */
$jquery("#createPageButton").on("click", function(page){
  pageEditPanel.style.display = "block";
  pageElementEditPanel.style.display = "none";
  $jquery("#pageIndexInPath").val("");
});

let editPathElement = function(element_idx){
  PubSub.publish("edit-path-element", element);
}

let generatePagePathListItem = function(page, index){
  var element=  `
  <div  class="row path-element" data-index="` + index + `">
    <div class="col-xs-2 path-element-type">
      URL
    </div>
    <div class="col-xs-8 path-element-value">`
      + page.url +`
    </div>
    <div class="col-xs-2 icons" >
      <i class="fa fa-pencil icon"></i>
      <i class="fa fa-times icon delete-icon" ></i>
    </div>
  </div>`;
     //  To do something

   return element;
}

let generatePageElementPathListItem = function(path_element, index){
  var element=  `
    <div class="row path-element" data-index="` + index + `">
      <div class="col-xs-10">
        <div class="col-xs-2 path-element-type">
          xpath
        </div>
        <div class="col-xs-10 path-element-value">`
          + path_element.element.xpath +`
        </div>
        <div class="col-xs-3 path-element-value">
          `+ path_element.action.name + `
        </div>
        <div class="col-xs-9 path-element-value" >`
          + path_element.action.value + `
        </div>
      </div>
      <div class="col-xs-2 icons" >
        <i class="fa fa-pencil icon edit-icon"></i>
        <i class="fa fa-times icon delete-icon"></i>
      </div>
    </div>`;
     //  To do something

     return element;
}

/*
 * redraw a specific element
 */
let redrawPathElement = function(element, index){
  var list_item_html = generatePageElementPathListItem(element, indexz);
  $jquery("#test_path_viewer").children().get(index).html(list_item_html);
}

/*
 * Redraws the entire list of path elements
 */
let redrawPath = function(path){
  var list_html = "";
  for(var idx=0; idx<path.length; idx++){
    var element = path[idx];
    if(element.url){
      list_html += generatePagePathListItem(element, idx);
    }
    else if(element.element){
      list_html += generatePageElementPathListItem(element, idx);
    }
  }
  $jquery("#test_path_viewer").html(list_html);
}

/*
 * Deletes an element at the given index form the given path array,
 *    then redraws the path
 */
let deletePathElement = function(path, index){
  path.splice(index, 1);
  localStorage.setItem("path", JSON.stringify(path));
  redrawPath(path);
}

$jquery("#element_selector").on('click', function(){
  console.log("clicked element selector");
  //if recording is currently running pause it
  selector_status = "active";

  if(recording_status === "stopped"){
    //fire event to stop listening for url change events and action events
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
      chrome.tabs.sendMessage(tabs[0].id, {msg: "start_recording"}, function(response) {
      });
    });
  }
  //activate listener for click events similar to recording, but return element and xpath here

  //if recording was running at start of session then resume recording
})

//receive path element
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.msg === "addToPath") {
          //if selector button set selector status to active then retrieve xpath and set it to element xpath field value
          if(selector_status === "active"){
            selector_status = "disabled";
            console.log("Request value :: "+request);
              console.log("Request value 2 :: "+JSON.stringify(request));
            //fire event to stop listening for url change events and action events
            if(recording_status === "stopped"){
              chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                chrome.tabs.sendMessage(tabs[0].id, {msg: "stop_recording"}, function(response) {
                });
              });
            }
            $jquery("#pageElementXpath").val(request.data.pathElement.element.xpath);
            //set item xpath in element xpath field
          }
          else {
            var path = JSON.parse(localStorage.getItem("path"));

            if(path === undefined || path === null){
              path = new Array();
              localStorage.setItem("path", JSON.stringify(path));
            }

            if(path.length === 0){
              //push page into path
              path.push({url : request.data.url});
              $jquery("#test_path_viewer").append( generatePagePathListItem(request.data, path.length-1 ));
            }

            console.log("Path length after adding page :: "+path.length);
            //check if last element is equal to this element
            if(path[path.length-1].element && path[path.length-1].element.xpath === request.data.pathElement.element.xpath && path[path.length-1].action.name === request.data.pathElement.action.name){
              //check if last element actin pair was a typing action
              if(path[path.length-1].action.name === "sendKeys" && request.data.pathElement.action.name === "sendKeys"){
                console.log("sendKeys experienced, Adding action value to existing action");
                path[path.length-1].action.value = request.data.pathElement.action.value;
                console.log("new action value :: "+path[path.length-1].action.value);
                localStorage.setItem('path', JSON.stringify(path));
                redrawPath(path);
              }
              return;
            }

            path.push(request.data.pathElement);
            localStorage.setItem("path", JSON.stringify(path));

            console.log("path size :: "+path.length);
            console.log("PATH :: "+JSON.stringify(path));
            console.log("REQUEST DATA FOR ADDING TO PATH :: " + JSON.stringify(request.data));

            $jquery("#test_path_viewer").append( generatePageElementPathListItem(request.data.pathElement, path.length-1 ));
          }
        }
      }
);
