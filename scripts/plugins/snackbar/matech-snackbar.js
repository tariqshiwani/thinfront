(function($) {
  function constructor(options) {
    var settings = $.extend(
      {
        timeout: 10
      },
      options
    );

    var snackbarContainer = $(".snackbarContainer");
    if (snackbarContainer.length <= 0) {
      snackbarContainer = $("<div class='snackbarContainer'></div>");
      $("body").append(snackbarContainer);
    }
    var methods = {
      
      show: function(val, styleClass) {
        if (typeof val == "string") {
          val = { content: val };
        }
        var csnack = $("<div class='snackbar'></div>");
        if (styleClass) csnack.addClass(styleClass);
        csnack.html(val.content);
        snackbarContainer.prepend(csnack);
        if($(csnack).hasClass("cs-danger")){
          csnack.prepend("<span class='close-snack'>✕</span><img class='snack-icon' src='assets/images/ic_error.svg'><h2 class='title'>Error</h2>");
          // csnack.prepend("");
        }else{
          csnack.prepend("<span class='close-snack'>✕</span><img class='snack-icon' src='assets/images/ic_success.svg'><h2 class='title'>Success</h2>");
          // csnack.prepend("");
        }
        csnack.addClass("active");
        setTimeout(function() {
          csnack.css("-webkit-animation", "fadeOut 500ms");
          csnack.bind("webkitAnimationEnd", function() {
            csnack.remove();
          });
          csnack.remove();
        }, settings.timeout * 1000);
      }
    };

    return methods;
  }

  $.fn.snackbar = function(methodOrOptions) {
    return constructor(methodOrOptions);
  };
})(jQuery);

var snackbar = $("document").snackbar({ timeout: 5 });


$(document).on("click", ".close-snack", function(e) {
  $(this).parent(".snackbar").css("-webkit-animation", "fadeOut 500ms");
  $(this).parent(".snackbar").remove();
});