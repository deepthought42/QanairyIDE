// Minimal jQuery
const $$ = document.querySelectorAll.bind(document);
const $  = document.querySelector.bind(document);

function isLoggedIn(token) {
  // The user is logged in if their token isn"t expired
  return jwt_decode(token).exp > Date.now() / 1000;
}

function showOpenRecorder() {
  $("#open-recorder").classList.remove("hidden");
  $("#close-recorder").classList.add("hidden");

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    chrome.tabs.sendMessage(tabs[0].id, {action: "close_recorder"}, function(response) {});
  });
}

function showCloseRecorder() {
  $("#open-recorder").classList.add("hidden");
  $("#close-recorder").classList.remove("hidden");

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    chrome.tabs.sendMessage(tabs[0].id, {action: "open_recorder"}, function(response) {});
  });
}

function renderProfileView(authResult) {
  $(".default").classList.add("hidden");
  fetch(`https://${env.AUTH0_DOMAIN}/userinfo`, {
    headers: {
      "Authorization": `Bearer ${authResult.access_token}`
    }
  }).then(resp => resp.json()).then((profile) => {
    $(".profile").classList.remove("hidden");
    $(".logout-button").addEventListener("click", logout);
    $("#open-recorder").addEventListener("click", showCloseRecorder);
    $("#close-recorder").addEventListener("click", showOpenRecorder);

    showOpenRecorder();
  }).catch(logout);
}


function renderDefaultView() {
  $(".default").classList.remove("hidden");
  $(".profile").classList.add("hidden");

  $(".login-button").addEventListener("click", () => {
    $(".default").classList.add("hidden");
    chrome.runtime.sendMessage({
      type: "authenticate"
    });
  });
}

function main () {
  const authResult = JSON.parse(localStorage.authResult || "{}");
  const token = authResult.id_token;
  if (token && isLoggedIn(token)) {
    renderProfileView(authResult);
  } else {
    renderDefaultView();
  }
}

function logout() {
  // Remove the idToken from storage
  localStorage.clear();
  let logoutUrl = new URL(`https://${env.AUTH0_DOMAIN}/v2/logout`);
  const params = {
    client_id: env.AUTH0_CLIENT_ID,
    returnTo: chrome.identity.getRedirectURL() + "auth0"
  };
  logoutUrl.search = new URLSearchParams(params);
  chrome.identity.launchWebAuthFlow({
      "url": logoutUrl.toString()
    },
    function(responseUrl) {
      //console.log(responseUrl);
    }
  );
  main();
}

document.addEventListener("DOMContentLoaded", main);
