let $jquery = jQuery.noConflict();

$jquery("#actionValueContainer").hide();
$jquery("#export-error").hide();
$jquery("#export-404-error").hide(0);
$jquery("#export_test_btn_text").show();
$jquery("#export_test_btn_waiting_txt").hide();
$jquery("#export_test_success_text").hide();
$jquery("#test_saved_successfully_msg").hide();
$jquery("#save-element-btn-txt").hide();
$jquery("#save-page-btn-txt").hide();

let startRecording = document.getElementById("startRecording");
let stopRecording = document.getElementById("stopRecording");
let pageEditPanel = document.getElementById("pageForm");
let pageElementEditPanel = document.getElementById("pageElementForm");
let selector_status = "disabled";

let close_ide = function(){
  //hide parent element
  var qanairy_ide = document.getElementById("qanairy_ide");
  qanairy_ide.style.display = "none";

  //reset localStorage
  localStorage.removeItem("path");
  localStorage.removeItem("status");
}

/*
 * Shows page creation form when button is clicked
 */
$jquery("#createPageButton").on("click", function(page){
  pageEditPanel.style.display = "block";
  pageElementEditPanel.style.display = "none";
  $jquery("#add-page-btn-txt").show();
  $jquery("#save-page-btn-txt").hide();
  $jquery("#pageIndexInPath").val("");
});

let generatePagePathListItem = function(page, index){
  var element=  `
  <div  class="row path-element" data-index="` + index + `">
    <div class="path-element-data">
      <div class="col-xs-2 path-element-type">
        URL
      </div>
      <div class="col-xs-8 path-element-value">`
        + page.url +`
      </div>
    </div>
    <div class="col-xs-2 icons" >
      <i class="fas fa-pencil icon edit-icon fa-2x"></i>
      <i class="fas fa-times icon delete-icon fa-2x" ></i>
    </div>
  </div>`;

  return element;
}

let generatePageElementPathListItem = function(path_element, index){
  var element=  `
    <div class="row path-element" data-index="` + index + `">
      <div class="col-xs-10  path-element-data">
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
        <i class="fas fa-pencil fa-lg icon edit-icon fa-2x"></i>
        <i class="fas fa-times fa-lg icon delete-icon fa-2x"></i>
      </div>
    </div>`;
    return element;
}

/*
 * redraw a specific element
 */
let redrawPathElement = function(element, index){
  var list_item_html = generatePageElementPathListItem(element, index);
  $jquery("#test_path_viewer").children().eq(index).html(list_item_html);
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
};

$jquery("#element_selector").on("click", function(){
  //if recording is currently running pause it
  selector_status = "active";

  //fire event to stop listening for url change events and action events
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    chrome.tabs.sendMessage(tabs[0].id, {msg: "listen_for_element_selector"}, function(response) {
      localStorage.status_before_select = localStorage.status;
      localStorage.setItem("status","selecting");
    });
  });
});

$jquery(document).ready(function(){
  var test_mem = localStorage.test;
  var path = null;

  if(localStorage.path && localStorage.path !== "undefined"){
    path = JSON.parse(localStorage.path);
  }
  else{
    path = [];
  }

  if(path){
    redrawPath(path);
  }
});

$jquery("#createNewTest").on("click", function(){
  localStorage.setItem("path", JSON.stringify([]));
  localStorage.removeItem("test");

  $jquery("#test_path_viewer").html("");
});

$jquery("#test_path_viewer").on("click", ".delete-icon", function(e){
  var path = JSON.parse(localStorage.getItem("path"));
  var confirmed = confirm("Are you sure you want to delete this step?");
  var index = $jquery(this).parent().parent().data("index");
  if(confirmed){
    deletePathElement(path, index);
  }
});

//handle clicking on button for adding custom page element<->action pairs to path
$jquery("#createPageElementButton").on("click", function(){
  $jquery("#pageElementXpath").val("");
  $jquery("actionName").val("");
  $jquery("#actionValue").val("");
  $jquery("#pageElementIndexInPath").val("");

  pageEditPanel.style.display = "none";
  pageElementEditPanel.style.display = "block";
  $jquery("#add-element-btn-txt").show();
  $jquery("#save-element-btn-txt").hide();
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
      name : $jquery("#actionName").val(),
      value: $jquery("#actionValue").val()
    }
  }

  var path = JSON.parse(localStorage.path);
  var index = $jquery("#pageElementIndexInPath").val();
  if(index && index.length > 0){
    path[ index ] = element_action;
  }
  else {
    path.push(element_action);
  }
  redrawPath(path);
  localStorage.setItem("path", JSON.stringify(path));
  chrome.runtime.sendMessage({msg: "update_path", data: path}, function(response) {});

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

  var url = $jquery("#pageUrl").val();
  if(url.indexOf("http://") < 0 && url.indexOf("https://") < 0){
    url = "http://"+url;
  }

  var page = {
    url: url
  }

  var path = JSON.parse(localStorage.path);
  var index = $jquery("#pageIndexInPath").val();
  if(index && index.length > 0){
    path[ index ] = page;
  }
  else {
    path.push(page);
  }
  localStorage.setItem("path", JSON.stringify(path));
  chrome.runtime.sendMessage({msg: "update_path", data: path}, function(response) {});

  redrawPath(path);
  //reset page form fields
  $jquery("#pageIndexInPath").val(null);
  $jquery("#pageUrl").val(null);
});

//clicking on the edit icon(pencil) loads the path element info into the appropriate
// edit panel
$jquery("#test_path_viewer").on("click", ".edit-icon", function(e){
    //send element to path element form
    var index = $jquery(this).parent().parent().data("index");
    $jquery("#pageIndexInPath").val(index);
    var element = JSON.parse(localStorage.getItem("path"))[index];

    if(element.element){
      //send to path element form
      $jquery("#pageElementXpath").val(element.element.xpath);
      $jquery("#pageElementXpath").addClass("highlighted-background").delay(20000).queue(function(next){
          $jquery(this).removeClass("highlighted-background");
      });

      $jquery("#actionName").val(element.action.name);
      if(element.action.name === "sendKeys"){
          $jquery("#actionValue").val(element.action.value);
          $jquery("#actionValueContainer").show();
      }
      else if(element.action.name === "click"){
          $jquery("#actionValue").val(element.action.value);
          $jquery("#actionValueContainer").hide();
      }

      $jquery("#pageElementIndexInPath").val(index);
      pageEditPanel.style.display = "none";
      pageElementEditPanel.style.display = "block";
      $jquery("#add-element-btn-txt").hide();
      $jquery("#save-element-btn-txt").show();
    }
    else if(element.url){
      //send to path element form
      $jquery("#pageUrl").val(element.url);
      $jquery("#pageUrl").addClass("highlighted-background").delay(20000).queue(function(next){
          $jquery(this).removeClass("highlighted-background");
      });

      pageEditPanel.style.display = "block";
      pageElementEditPanel.style.display = "none";
      $jquery("#add-page-btn-txt").hide();
      $jquery("#save-page-btn-txt").show();
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
      localStorage.status = "recording";
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
      localStorage.status = "stopped";
    });
  });
};

$jquery("#runTestButton").on("click", function(element){
  var path = JSON.parse(localStorage.getItem("path"));
  //send path to content script to be ran
  chrome.runtime.sendMessage({type: "start_test_run", data: path}, function(response) {
  });
});

$jquery("#actionName").change(function(){
  if( $jquery("#actionName option:selected").val() === "sendKeys"){
    $jquery("#actionValueContainer").show();
  }
  else {
    $jquery("#actionValueContainer").hide();
  }
});

/*
 *  Exports a test to the Qanairy platform. Before allowing export, it requires
 *  the user to input a name for the created test
 *
 */
$jquery("#exportTest").on("click", function(element){
    $jquery(this).prop("disabled",true);
    $jquery("#export_test_btn_text").hide();
    $jquery("#export_test_btn_waiting_txt").show();

    var auth = JSON.parse(localStorage.getItem("authResult"));
    var path = JSON.parse(localStorage.getItem("path"));

    var key = "";
    if(localStorage.test){
      key = JSON.parse(localStorage.test).key;
    }

    var test_name = prompt("Please name your test");
    if(test_name === null){
      return;
    }
    var start_url = "";

    for(var idx=0; idx < path.length; idx++){
      if(path[idx].url){
        start_url = path[idx].url;
        break;
      }
    }

    $jquery.ajax({

      // The 'type' property sets the HTTP method.
      // A value of 'PUT' or 'DELETE' will trigger a preflight request.
      type: "POST",

      // The URL to make the request to.
      url: "https://staging-api.qanairy.com/testIDE",

      // The 'contentType' property sets the 'Content-Type' header.
      // The JQuery default for this property is
      // 'application/x-www-form-urlencoded; charset=UTF-8', which does not trigger
      // a preflight. If you set this value to anything other than
      // application/x-www-form-urlencoded, multipart/form-data, or text/plain,
      // you will trigger a preflight request.
      contentType: "application/json",
      data: JSON.stringify({key: key, domain_url: start_url, name: test_name, path: path}),
      xhrFields: {
        // The 'xhrFields' property sets additional fields on the XMLHttpRequest.
        // This can be used to set the 'withCredentials' property.
        // Set the value to 'true' if you'd like to pass cookies to the server.
        // If this is enabled, your server must respond with the header
        // 'Access-Control-Allow-Credentials: true'.
        withCredentials: true
      },
      headers: {
      },
      beforeSend: function(xhr, settings) {
        xhr.setRequestHeader("Authorization","Bearer " + auth.access_token);
      },
      success: function(response) {
        $jquery("#exportTest").prop("disabled",false);
        $jquery("#export_test_btn_text").show();
        $jquery("#export_test_btn_waiting_txt").hide();
        $jquery("#export_test_success_text").show(0).delay(20000).hide(0);

        chrome.runtime.sendMessage({msg: "show-test-saved-msg"}, function(response) {});
      },

      error: function(response) {
        $jquery("#exportTest").prop("disabled",false);

        $jquery("#export_test_btn_text").show();
        $jquery("#export_test_btn_waiting_txt").hide();
        if(response.status === 0){
          $jquery("#export-404-error").show(0).delay(20000).hide(0);
        }else{
          $jquery("#export-error").show(0).delay(20000).hide(0);
        }

        // Here's where you handle an error response.
        // Note that if the error was due to a CORS issue,
        // this function will still fire, but there won't be any additional
        // information about the error.
        // Trigger desktop notification that test was saved successfully
        var options = {
          type: "basic",
          title: "Save failed",
          message: "Unable to save test. Please try again.",
          iconUrl: "images/qanairy_q_logo_black_48.png",
          isClickable: true
        }

        chrome.notifications.create("test-save-failed", options, function(id) {});
      }
    });
});

//receive path element
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if(request.msg === "setElementXpath"){
          $jquery("#pageElementXpath").val(request.data);
          selector_status = "disabled";
        }
        else if (request.msg === "addToPath") {
          //if selector button set selector status to active then retrieve xpath and set it to element xpath field value
          if(selector_status === "active" && localStorage.status_before_select === "recording"){
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
              chrome.tabs.sendMessage(tabs[0].id, {msg: "start_recording"}, function(response) {
                localStorage.removeItem("status_before_select");
              });
            });
          }

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

          //check if last element is equal to this element
          if(path[path.length-1].element && path[path.length-1].element.xpath === request.data.pathElement.element.xpath && path[path.length-1].action.name === request.data.pathElement.action.name){
            //check if last element actin pair was a typing action
            if(path[path.length-1].action.name === "sendKeys" && request.data.pathElement.action.name === "sendKeys"){
              path[path.length-1].action.value = request.data.pathElement.action.value;
              localStorage.setItem("path", JSON.stringify(path));

              redrawPath(path);
            }
            return;
          }
          path.push(request.data.pathElement);
          last_node = request.data.pathElement;
          localStorage.setItem("path", JSON.stringify(path));
          redrawPath(path);
        }
        else if (request.msg === "loadTest") {
          redrawPath(JSON.parse(request.data).path);
        }
        else if (request.msg === "show-test-saved-successfully-msg"){
          $jquery("#test_saved_successfully_msg").html("'" + request.data + "' was created successfully");
          $jquery("#test_saved_successfully_msg").show(0).delay(20000).hide(0);
        }
        return Promise.resolve("Dummy response to keep the console quiet");
      }
);

if(localStorage.status === 'recording'){
  stopRecording.style.display = "block";
  startRecording.style.display = "none";

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    chrome.tabs.sendMessage(tabs[0].id, {msg: "start_recording", data: {}}, function(response) {
      localStorage.status = "recording";
    });
  });
}
