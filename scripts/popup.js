
  var auth0 = new auth0.WebAuth({
    domain: "staging-qanairy.auth0.com",
    clientID:  "mMomHg1ZhzZkM4Tsz2NGkdJH3eeJqIq6",//"wT7Phjs9BpwEfnZeFLvK1hwHWP2kU7LV",
    responseType: "token id_token",
    audience: "https://staging-api.qanairy.com",
    scope: "openid profile email read:domains delete:domains update:domains create:domains create:accounts read:accounts delete:accounts update:accounts read:tests update:tests read:groups update:groups create:groups delete:groups run:tests start:discovery read:actions"
  });


  $("#login").on('click',  function(){
    console.log("login clicked");

    var settings = {
      "async": true,
      "crossDomain": true,
      "url": "https://staging-qanairy.auth0.com/dbconnections/login",
      "method": "POST",
      "headers": {
        "content-type": "application/x-www-form-urlencoded"
      },
      "data": {
        "client_id": "mMomHg1ZhzZkM4Tsz2NGkdJH3eeJqIq6",
        "email": $('#login_email').val(),
        "password": $('#login_password').val(),
        "connection": "Username-Password-Authentication"
      }
    };

    console.log("login clicked");

    auth0.loginAndAuthorize(settings.data, function(err, res){
      console.log("response :: "+err + "   :    " + Object.keys(res));
      if(!err){

      }
    });
  });
