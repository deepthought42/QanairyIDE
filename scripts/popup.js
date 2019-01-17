
  var lock = new Auth0Lock(
    'mMomHg1ZhzZkM4Tsz2NGkdJH3eeJqIq6',
    'staging-qanairy.auth0.com', {
    auth: {
      responseType: 'code',
      params: {
        scope: 'openid email' // Learn about scopes: https://auth0.com/docs/scopes
      }
    }
  });

  // Listening for the authenticated event
  lock.on("authenticated", function(authResult) {
    // Use the token in authResult to getUserInfo() and save it to localStorage
    lock.getUserInfo(authResult.accessToken, function(error, profile) {
      if (error) {
        // Handle error
        return;
      }

      document.getElementById('nick').textContent = profile.nickname;

      localStorage.setItem('accessToken', authResult.accessToken);
      localStorage.setItem('profile', JSON.stringify(profile));
    });
  });

  lock.show();
