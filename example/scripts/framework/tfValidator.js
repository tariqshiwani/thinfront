(function() {
  if (typeof window.tf !== "undefined") {
    window.tf.validate = function(form) {
      var hasErrors = false;
      // remove all existing validation classes from inputs


      $(form).find('.tf-validate-error')
      .each(function(i, o) {
       $(o).removeClass('tf-validate-error');
      });

    
      // remove all existing validator messages

      $(form).find('.tf-validate-error-message')
      .each(function(i, o) {
        $(o).remove();
      });

     // validate all fields
      $(form).find('input[validate]')
      .each(function(i, o) {
        var thisElementHasError = false;
        // required field validator
        if ($(o).attr("required")) {
          if ($(o).val() == "") {
            $(o).parent().append('<span class=\'tf-validate-error-message\'>This field is required</span>');
            $(o).addClass('tf-validate-error');
            hasErrors = true;
            thisElementHasError = true;
          }
           // type validator
           if (!thisElementHasError) {
          }
        }
      });


   
  
      return { hasErrors: hasErrors, errorList: [] };
    };
  }
})();
