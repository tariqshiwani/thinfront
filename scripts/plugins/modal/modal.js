var modal = (function() {
  var existing = false;
  var modalContent = null;
  var currentParent = null;
  function close() {
    if (existing) {
      var ex = $("#_modal_block_ui").find("[modal-box-existing]");
      ex.appendTo(currentParent);
      ex.find(".modal-box-button").off("click.modal-box");
      ex.hide();
    }
    $("#_modal_block_ui").remove();

    $(document).off("keydown.modal-escape");
  }

  return {
    show: function(title, content, buttons, callback) {
      var container = $("body");
      existing = false;

      if (buttons == null) {
        buttons = [
          { label: "OK", value: "ok" },
          { label: "Cancel", value: "cancel" }
        ];
      }

      var blk = $("#_modal_block_ui");
      blk = $("#_modal_block_ui");
      if (blk.length != 0) blk.empty();
      else blk = $("<div id='_modal_block_ui' class='loader_block_ui'></div>");
      container.append(blk);

      if (typeof title == "object") {
        existing = true;
        modalContent = title;
        title.attr("modal-box-existing", "");
        title.show();
        currentParent = $(title.parent());
        blk.append(title);
      } else {
        blk.append(
          $(
            "<div class='modal-box'><div class='modal-box-title'></div><div class='modal-box-content'></div><div class='page-foot'><div class='modal-box-controls'></div></div></div>"
          )
        );
        blk.find(".modal-box-title").html("<h2>" + title + "</h2>");
        blk.find(".modal-box-content").text(content);
        var controls = blk.find(".modal-box-controls");
        for (btn in buttons) {
          var btnObj = $(
            "<button class='modal-box-button'>" +
              buttons[btn].label +
              "</button>"
          );
          btnObj.data("value", buttons[btn].value);
          $(controls).append(btnObj);
        }
      }
      $(".modal-box-button").each(function(i, o) {
        $(o).on("click.modal-box", function() {
          var clickVal = $(this).data("value");
          var _result = true;
          if (callback) {
            _result = callback(clickVal);
            if (_result == null) _result = true;
          }
          if (_result) close();
        });
      });

      $(document).on("keydown.modal-escape", function(event) {
        if (event.keyCode == 27) close();
      });
    },
    hide: function() {
      close();
    }
  };
})();
