let startRecording = document.getElementById('startRecording');



startRecording.onclick = function(element) {
  console.log("sending message ");
  chrome.runtime.sendMessage({recorder: "start"}, function(response) {
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


/*
  let color = element.target.value;
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.executeScript(
        tabs[0].id,
        {code: 'document.body.style.backgroundColor = "' + color + '";'});
  });
  */
};

let stopRecording = document.getElementById('stopRecording');

stopRecording.onclick = function(element){
  console.log("stopping event listener");
  document.removeEventListener("click", action_listener);

  //fire event to stop listening for url change events and action events
  chrome.runtime.sendMessage({recorder: "stop"}, function(response) {
    console.log(response.status);
    alert(response.status);
  });

}
