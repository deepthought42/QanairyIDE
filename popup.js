let startRecording = document.getElementById('startRecording');

startRecording.onclick = function(element) {
  console.log("sending message ");
  chrome.runtime.sendMessage({msg: "start"}, function(response) {
    console.log(response.status);
  });


  chrome.tabs.query(
      { currentWindow: true, active: true },
      function (tabArray) {
        chrome.tabs.sendMessage(tabArray[0].id, {status: "recording"}, function(response){
          console.log("sent message to tab id :: "+tabArray[0].id);
        })
      }
  );
};

let stopRecording = document.getElementById('stopRecording');

stopRecording.onclick = function(element){
  console.log("stopping event listener");

  //fire event to stop listening for url change events and action events
  chrome.runtime.sendMessage({msg: "stop"}, function(response) {
    console.log(response.status);
  });

}

//receive path element
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.msg === "appendPathElement") {
            //  To do something

            console.log(request.data);
            $('#test_path_viewer').append("<div>"+request.data+"</div>");
        }
    }
);
