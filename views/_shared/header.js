//var header = (function() {
var userData = { firstName: "Tariq", lastName: "Shiwani" }; //tf.cookies.get("userData");
if (userData) {
  //userData = JSON.parse(tf.cookies.get("userData"));
  $("#userName")
    .find(".user-names")
    .text(userData.firstName + " " + userData.lastName);
}

$("#signOut").click(function () {
  tf.cookies.erase("token");
  tf.cookies.erase("UserDetails");
  tf.navigate("account");
});
// })();

// $("#m_header_menu .m-menu__item a.m-menu__link").click(function() {
//   $("#m_header_menu .m-menu__item a.m-menu__link").removeClass("active");
//   $(this).addClass("active");
// });
// var crUrl = $(location).attr("href");
// if (crUrl.indexOf("#whorders") > -1) {
//   $("#m_header_menu .m-menu__item a.m-menu__link[href='#whorders']").addClass(
//     "active"
//   );
// }
// if (crUrl.indexOf("#home") > -1) {
//   $("#m_header_menu .m-menu__item a.m-menu__link[href='#home']").addClass(
//     "active"
//   );
// }
