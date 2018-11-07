let $jquery = jQuery.noConflict();

let startRecording = document.getElementById('startRecording');
let stopRecording = document.getElementById('stopRecording');
let pageEditPanel = document.getElementById('pageForm');
let pageElementEditPanel = document.getElementById('pageElementForm');

$jquery(document).ready(function(){
  var path = JSON.parse(localStorage.getItem('path'));
  console.log("document loaded "+path.length);
  redrawPath(path);
});

$jquery('#createNewTest').on('click', function(){
  localStorage.setItem('path', JSON.stringify([]));
  $jquery('#test_path_viewer').html("");
});

$jquery('.deleteIcon').on('click', function(e){
  conosle.log("delete icons and stuff");
  console.log("delete icon clicked");
  var path = JSON.parse(localStorage.getItem(path));
  deletePathElement(path);
});

//handle clicking on button for adding custom page element<->action pairs to path
$jquery('#createPageElementButton').on("click", function(){
  $jquery('#pageElementXpath').val("");
  $jquery('actionName').val("");
  $jquery('#actionValue').val("");
  $jquery('#pageElementIndexInPath').val("");

  pageEditPanel.style.display = "none";
  pageElementEditPanel.style.display = "block";
  $jquery('#pageElementIndexInPath').val("");
});

/*saves a page element by either updateing it if the index is set, otherwise
 * creating a new page element action set and appending the set to the end of
 * the path stored in localhost
*/
$jquery('#savePageElementButton').on("click", function(){
  var element_action = {
    element: {
      xpath: $jquery('#pageElementXpath').val()
    },
    action :{
      name : $jquery('actionName').val(),
      value: $jquery('#actionValue').val()
    }
  }

  var path = JSON.parse(localStorage.path);
  var index = $jquery('#pageElementIndexInPath').val();
  if(index && index.length > 0){
    path[ index ] = element_action;
    redrawPathElement(element_action, index);
  }
  else {
    path.push(element_action);
    $jquery('#test_path_viewer').append( generatePageElementPathListItem(element_action, path.length-1 ));
  }
  localStorage.setItem('path', JSON.stringify(path));

  //reset page element <-> action form fields
   $jquery('#pageElementXpath').val(null);
   $jquery('actionName').val(null);
   $jquery('#actionValue').val(null);
   $jquery('#pageElementIndexInPath').val(null);
});

/*saves a page by either updateing it if the index is set, otherwise
 * creating a new page and appending it to the end of
 * the path stored in localhost
*/
$jquery('#savePageButton').on("click", function(){
  var page = {
    url: $jquery('#pageUrl').val()
  }

  var path = JSON.parse(localStorage.path);
  var index = $jquery('#pageIndexInPath').val();
  if(index && index.length > 0){
    path[ index ] = page;
    redrawPathElement(page, index);
  }
  else {
    path.push(page);
    $jquery('#test_path_viewer').append( generatePagePathListItem(page, path.length-1 ));
  }
  localStorage.setItem('path', JSON.stringify(path));

  //reset page form fields
  $jquery('#pageIndexInPath').val(null);
  $jquery('#pageUrl').val(null);
});

/*
 * Handles clicks on path elements and routes to the proper form and functionality based on
 * which path element is clicked on.
 */
$jquery('#test_path_viewer').on("click", ".path-element", function(){
    //send element to path element form
    var index = $jquery(this).data("index");
    var element = JSON.parse(localStorage.getItem("path"))[index];

    if(element.element){
      //send to path element form
      $jquery('#pageElementXpath').val(element.element.xpath);
      $jquery('actionName').val(element.action.name);
      $jquery('#actionValue').val(element.action.value);
      $jquery('#pageElementIndexInPath').val(index);
      pageEditPanel.style.display = "none";
      pageElementEditPanel.style.display = "block";
    }
    else if(element.url){
      //send to path element form
      $jquery('#pageUrl').val(element.url);
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
  chrome.tabs.query(
      { currentWindow: true, active: true },
      function (tabArray) {
        chrome.tabs.sendMessage(tabArray[0].id, {status: "recording"}, function(response){
          console.log("sent message to tab id :: "+tabArray[0].id);
        })
      }
  );
};

//Stop recording user interactions
stopRecording.onclick = function(element){
  stopRecording.style.display = "none";
  startRecording.style.display = "block";

  //fire event to stop listening for url change events and action events
  chrome.runtime.sendMessage({msg: "stop"}, function(response) {
    console.log(response.status);
  });

}

/*
 *  Exports a test to the Qanairy platform. Before allowing export, it requires
 *  the user to input a name for the created test
 *
 */
$jquery('#exportTest').on('click', function(element){
    var path = JSON.parse(localStorage.getItem('path'));
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
      if (xhr.readyState == 4) {
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
$jquery('#createPageButton').on('click', function(page){
  console.log("show page edit panel");
  pageEditPanel.style.display = "block";
  pageElementEditPanel.style.display = "none";
  $jquery('#pageIndexInPath').val("");
});

let editPathElement = function(element_idx){
  console.log("editing path element  ::  " + element);
  PubSub.publish('edit-path-element', element);
}

let generatePagePathListItem = function(page, index){
  var element=  `
  <div  class='row path-element' data-index="` + index + `">
    <div class="col-xs-10">
      <div class='col-xs-3 path-element-type'>
        URL
      </div>
      <div class='col-xs-9 path-element-value'>`
        + page.url +`
      </div>
    </div>
    <div class='col-xs-2 icons' >
      <i class='fa fa-pencil icon'></i>
      <i class='fa fa-times icon delete-icon' ></i>
    </div>
  </div>`;
     //  To do something

   return element;
}

let generatePageElementPathListItem = function(path_element, index){
  var element=  `
    <div class='row path-element' data-index="` + index + `">
      <div class="col-xs-10">
        <div class='col-xs-2 path-element-type'>
          xpath
        </div>
        <div class='col-xs-10 path-element-value'>`
          + path_element.element.xpath +`
        </div>
        <div class='col-xs-2 path-element-type'>
          `+ path_element.action.name + `
        </div>
        <div class='col-xs-10 path-element-value' >`
          + path_element.action.value + `
        </div>
      </div>
      <div class='col-xs-2 icons' >
        <i class='fa fa-pencil icon edit-icon'></i>
        <i class='fa fa-times icon delete-icon'></i>
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
  $jquery('#test_path_viewer').children().get(index).html(list_item_html);
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
  $jquery('#test_path_viewer').html(list_html);
}

/*
 * Deletes an element at the given index form the given path array,
 *    then redraws the path
 */
let deletePathElement = function(path, index){
  path.splice(index, 1);
  localStorage.setItem('path', JSON.stringify(path));
  redrawPath(path);
}

//receive path element
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.msg === "addToPath") {
          var path = JSON.parse(localStorage.getItem("path"));
          console.log("path is null ? "+(path===null));

          console.log("path is undefined ? "+(path===undefined));
          if(path === undefined || path === null){
            path = new Array();
            localStorage.setItem("path", JSON.stringify(path));
          }

          console.log("Path length "+path.length);
          if(path.length === 0){
            //push page into path
            path.push({url : request.data.url});
            $jquery('#test_path_viewer').append( generatePagePathListItem(request.data.url, path.length-1 ));
          }

          console.log("Path length after adding page :: "+path.length);
          //check if last element is equal to this element
          if(path[path.length-1].element && path[path.length-1].element.xpath == request.data.pathElement.element.xpath){
            console.log("elements match");
            console.log("path[path.length-1].element.xpath  :   "+path[path.length-1].element.xpath );
            console.log("request.data.element.xpath  ::   "+request.data.pathElement.element.xpath);

            return;
          }

          path.push(request.data.pathElement);
          localStorage.setItem("path", JSON.stringify(path));

          console.log("path size :: "+path.length);
          console.log("PATH :: "+JSON.stringify(path));
          console.log("REQUEST DATA FOR ADDING TO PATH :: " + request.data.pathElement);

          $jquery('#test_path_viewer').append( generatePageElementPathListItem(request.data.pathElement, path.length-1 ));
        }
      }
);
