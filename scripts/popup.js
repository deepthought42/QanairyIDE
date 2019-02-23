    function isLoggedIn(token) {
      // The user is logged in if their token isn't expired
      return jwt_decode(token).exp > Date.now() / 1000;
    }

    function logout() {
      // Remove the idToken from storage
      localStorage.clear();
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {action: "open_dialog_box", msg: "close_recorder"}, function(response) {
          //console.log("received response from request for open recorder :: "+response);
        });
      });
      window.close();
    }

    // Minimal jQuery
    const $$ = document.querySelectorAll.bind(document);
    const $  = document.querySelector.bind(document);


    function renderProfileView(authResult) {
      $(".default").classList.add("hidden");
      $(".loading").classList.remove("hidden");
      fetch("https://staging-qanairy.auth0.com/userinfo", {
        headers: {
          "Authorization": `Bearer ${authResult.access_token}`
        }
      }).then((resp) => resp.json()).then((profile) => {
        localStorage.profile = profile;
        $(".loading").classList.add("hidden");
        $(".profile").classList.remove("hidden");
        $(".logout-button").addEventListener("click", logout);
      }).catch(logout);
    }


    function renderDefaultView() {
      $(".default").classList.add("hidden");
      $(".loading").classList.remove("hidden");
      chrome.runtime.sendMessage({
          msg: "authenticate"
        }, function(response){
          window.close();
        }
      );
    }

    function main () {
      const authResult = JSON.parse(localStorage.authResult || "{}");
      const token = authResult.id_token;
      if (token && isLoggedIn(token)) {
        renderProfileView(authResult);

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
          chrome.tabs.sendMessage(tabs[0].id, {action: "open_dialog_box", msg: "open_recorder"}, function(response) {});
        });
        //send message to open recorder panel
        chrome.runtime.sendMessage({msg: "subscribe_to_platform", data: token}, function(response) {
            //console.log("received response from request for subscribe_to_platform :: "+response);
          });

      } else {
        renderDefaultView();
      }
    }

    document.addEventListener("DOMContentLoaded", main);
