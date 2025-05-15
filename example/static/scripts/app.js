$(document).ready(function () {
  tf.init();
  if (typeof window.tf !== "undefined") {
    window.tf.events = (function () {
      return {
        beforeLayoutRender: function (layout) {
          console.log("loading layout ", layout);
        },
        afterLayoutRender: function (layout) {
          console.log("loaded layout", layout);
        },
        beforeViewRender: function (view) {
          console.log("loading view ", view);
        },
        afterViewRender: function (view) {
          console.log("loaded view ", view);
        },
        pagePermission: function (urlObj, allowed) {
          if (!allowed) {
            console.log(
              "you do not have permission to access this resource",
              "cs-danger"
            );
          }
        },
        servicePermission: function (url, allowed, source) {
          if (!allowed) {
            console.log(
              "you do not have permission to access this resource",
              "cs-danger"
            );
          }
        },
        notLoggedIn: function () {
          console.log("not logged in");
        },
        tokenExpired: function () {
          console.log("token has expired");
        },
      };
    })();
  }
});
