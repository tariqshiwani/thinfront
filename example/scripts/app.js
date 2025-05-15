$(document).ready(function () {
  tf.init();
  if (typeof window.tf !== "undefined") {
    window.tf.events = (function () {
      return {
        beforeLayoutRender: function (layout) {
          console.log("loading layout ", layout);
          decimalConfig = tf.settings();
          decimalConfig = decimalConfig.decimalPoints;
        },
        afterLayoutRender: function (layout) {
          console.log("loaded layout", layout);
          var Config = tf.settings();
          var currnecySign = Config.CurrencySign;
          var OrderNoteColor = Config.OrderNoteRed;
          // var currnecySign = "";
          var NoteStyle;
          if (OrderNoteColor == true) {
            NoteStyle = $(
              "<style>.detail-box .form-group span.form-control.order_note {color:red;}</style>"
            );
            $("html > head").append(NoteStyle);
          }
          var styleTag = $(
            '<style>.currencySign:not(th)::before { display: inline-block;content:"' +
              currnecySign +
              '";}</style>'
          );
          $("html > head").append(styleTag);
        },
        beforeViewRender: function (view) {
          console.log("loading view ", view);
        },
        afterViewRender: function (view) {
          console.log("loaded view ", view);
        },
        pagePermission: function (urlObj, allowed) {
          if (!allowed) {
            snackbar.show(
              "you do not have permission to access this resource",
              "cs-danger"
            );
          }
          // console.log(
          //   "page permission event,",
          //   urlObj,
          //   "  allowed = ",
          //   allowed
          // );
        },
        servicePermission: function (url, allowed, source) {
          if (!allowed) {
            snackbar.show(
              "you do not have permission to access this resource",
              "cs-danger"
            );
          }
          // console.log(
          //   "service permission event,",
          //   url,
          //   "  allowed = ",
          //   allowed,
          //   " source ",
          //   source
          // );
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
