let startRecording = document.getElementById('startRecording');
let stopRecording = document.getElementById('stopRecording');
let pageEditPanel = document.getElementById('pageForm');
let pageElementEditPanel = document.getElementById('pageElementForm');


$('#createNewTest').on('click', function(){
  localStorage.setItem('path', JSON.stringify([]));
  $('#test_path_viewer').html("");
});

//handle clicking on button for adding custom page element<->action pairs to path
$('#createPageElementButton').on("click", function(){
  $('#pageElementXpath').val("");
  $('actionName').val("");
  $('#actionValue').val("");
  $('#pageElementIndexInPath').val("");

  pageEditPanel.style.display = "none";
  pageElementEditPanel.style.display = "block";
  $('#pageElementIndexInPath').val("");
});

/*saves a page element by either updateing it if the index is set, otherwise
 * creating a new page element action set and appending the set to the end of
 * the path stored in localhost
*/
$('#savePageElementButton').on("click", function(){
  var element_action = {
    element: {
      xpath: $('#pageElementXpath').val()
    },
    action :{
      name : $('actionName').val(),
      value: $('#actionValue').val()
    }
  }

  var path = JSON.parse(localStorage.path);
  console.log("Path before :: "+path.length);
  var index = $('#pageElementIndexInPath').val();
  if(index && index.length > 0){
    path[ index ] = element_action;
    console.log("updated element at :: "+index);
  }
  else {
    path.push(element_action);
    $('#test_path_viewer').append( generatePageElementPathListItem(element_action, path.length-1 ));
  }
  localStorage.setItem('path', JSON.stringify(path));
  console.log("path after  ::  "+path.length);

  //reset page element <-> action form fields
   $('#pageElementXpath').val(null);
   $('actionName').val(null);
   $('#actionValue').val(null);
   $('#pageElementIndexInPath').val(null);
});

/*saves a page by either updateing it if the index is set, otherwise
 * creating a new page and appending it to the end of
 * the path stored in localhost
*/
$('#savePageButton').on("click", function(){
  var page = {
    url: $('#pageUrl').val()
  }

  var path = JSON.parse(localStorage.path);
  console.log("Path before :: "+path.length);
  var index = $('#pageIndexInPath').val();
  if(index && index.length > 0){
    path[ index ] = page;
    console.log("updated element at :: "+index);
  }
  else {
    path.push(page);
    $('#test_path_viewer').append( generatePagePathListItem(page, path.length-1 ));
  }
  localStorage.setItem('path', JSON.stringify(path));

  //reset page form fields
  $('#pageIndexInPath').val(null);
  $('#pageUrl').val(null);
  console.log("path after  ::  "+path.length);
});

/*
 * Handles clicks on path elements and routes to the proper form and functionality based on
 * which path element is clicked on.
 */
$('#test_path_viewer').on("click", ".path-element", function(){
    //send element to path element form
    var index = $(this).data("index");
    console.log("Clicked path element "+index);

    var element = JSON.parse(localStorage.getItem("path"))[index];
    console.log("Path element :: "+element);
    console.log("PATH INDEX :: "+index);

    console.log("Path element :: "+ JSON.stringify(element));

    if(element.element){
      //send to path element form
      $('#pageElementXpath').val(element.element.xpath);
      $('actionName').val(element.action.name);
      $('#actionValue').val(element.action.value);
      $('#pageElementIndexInPath').val(index);
      pageEditPanel.style.display = "none";
      pageElementEditPanel.style.display = "block";
    }
    else if(element.url){
      //send to path element form
      $('#pageUrl').val(element.url);
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
  console.log("stopping event listener");

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
$('#exportTest').on('click', function(element){
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
        document.getElementById("resp").innerText = xhr.responseText;
      }
    }
    xhr.send(JSON.stringify({name: "test testing", path: path}));
});

/*
 * Shows page creation form when button is clicked
 */
$('#createPageButton').on('click', function(page){
  console.log("show page edit panel");
  pageEditPanel.style.display = "block";
  pageElementEditPanel.style.display = "none";
  $('#pageIndexInPath').val("");
});

let editPathElement = function(element_idx){
  console.log("editing path element  ::  " + element);
  PubSub.publish('edit-path-element', element);
}

let generatePagePathListItem = function(page, index){
  var element=  `
  <div  class='row path-element' data-index="` + index + `">
    <div class="element col-xs-10">
      <div class='col-xs-3 path-element-type'>
        URL
      </div>
      <div class='col-xs-9 path-element-value'>`
        + page.url +`
      </div>
    </div>
    <div class='col-xs-2 icons' >
      <i class='fa fa-pencil icon' onClick={this.editPathElement.bind(this, item)}></i>
      <i class='fa fa-times icon delete-icon' onClick={this.removePathElement.bind(this, item)}></i>
    </div>
  </div>`;
     //  To do something

   return element;
}

let generatePageElementPathListItem = function(path_element, index){
  var element=  `
    <div  class='row path-element' data-index="` + index + `">
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
        <i class='fa fa-pencil icon' onClick={this.editPathElement.bind(this, item)}></i>
        <i class='fa fa-times icon delete-icon' onClick={this.removePathElement.bind(this, item)}></i>
      </div>
    </div>`;
     //  To do something

     return element;
}

let redrawPathElement = function(element, index){
  var list_item_html = generatePageElementPathListItem(element, indexz);
  $('#test_path_viewer').children().get(index).html(element);

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
            $('#test_path_viewer').append( generatePagePathListItem(request.data.url, path.length-1 ));
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

          $('#test_path_viewer').append( generatePageElementPathListItem(request.data.pathElement, path.length-1 ));
        }
      }
);
