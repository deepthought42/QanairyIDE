    function isLoggedIn(token) {
      // The user is logged in if their token isn't expired
      return jwt_decode(token).exp > Date.now() / 1000;
    }

    function logout() {
      // Remove the idToken from storage
      localStorage.clear();
      main();
    }

    // Minimal jQuery
    const $$ = document.querySelectorAll.bind(document);
    const $  = document.querySelector.bind(document);


    function renderProfileView(authResult) {
      $('.default').classList.add('hidden');
      $('.loading').classList.remove('hidden');
      fetch(`https://staging-qanairy.auth0.com/userinfo`, {
        headers: {
          'Authorization': `Bearer ${authResult.access_token}`
        }
      }).then(resp => resp.json()).then((profile) => {
        localStorage.profile = profile;
        $('.loading').classList.add('hidden');
        $('.profile').classList.remove('hidden');
        $('.logout-button').addEventListener('click', logout);
      }).catch(logout);
    }


    function renderDefaultView() {
      $('.default').classList.add('hidden');
      $('.loading').classList.remove('hidden');
      chrome.runtime.sendMessage({
        msg: "authenticate"
      });
    }

    function main () {
      const authResult = JSON.parse(localStorage.authResult || '{}');
      const token = authResult.id_token;
      if (token && isLoggedIn(token)) {
        renderProfileView(authResult);
      } else {
        renderDefaultView();
      }
    }

    document.addEventListener('DOMContentLoaded', main);
