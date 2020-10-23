$(document).on("click", "[toggle]", function(e) {
  var $this = $(this);
  var tTarget = $($this.attr("toggle"));
  var tCls = $this.attr("toggle-class");
  if (tTarget.hasClass(tCls)) tTarget.removeClass(tCls);
  else tTarget.addClass(tCls);
});
