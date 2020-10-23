(function () {
  var _service_perm;
  if (typeof window.tf !== "undefined") {
    window.tf.service = (function () {
      return {
        permission: (function () {
          _service_perm = JSON.parse(localStorage.getItem("_service_perm"));
          if (!_service_perm) _service_perm = [];
          return {
            defaultPerm: true,
            set: function (url, perm) {
              if (!url || !perm) {
                console.error("invalid parameters");
                return;
              }
              if (perm != "allow" && perm != "deny") {
                console.error(
                  "invalid permission type, only 'allow' or 'deny' is permitted"
                );
                return;
              }
              if (!url.startsWith("/")) url = "/" + url;
              var existing = this.find(url);
              if (existing) {
                existing.type = perm;
              } else {
                _service_perm.push({
                  link: url,
                  type: perm,
                });
              }
              localStorage.setItem(
                "_service_perm",
                JSON.stringify(_service_perm)
              );
            },
            find: function (url) {
              if (!url.startsWith("/")) url = "/" + url;
              var perm = null;
              for (let x = 0; x < _service_perm.length; x++) {
                var element = _service_perm[x];
                if (element.link == url) {
                  perm = element;
                  break;
                }
              }
              return perm;
            },
            check: function (url, def) {
              if (!url.startsWith("/")) url = "/" + url;
              if (_service_perm.length == 0) {
                return def ? def : this.defaultPerm;
              } else {
                var spec = this.find(url);
                if (spec) {
                  return spec.type == "allow" ? true : false;
                } else {
                  return def ? def : this.defaultPerm;
                }
              }
            },
            clear: function () {
              _service_perm = [];
              localStorage.setItem(
                "_service_perm",
                JSON.stringify(_service_perm)
              );
            },
          };
        })(),
        get: function (
          url,
          data,
          callback,
          showLoader = true,
          async = true,
          completeCb
        ) {
          if (!this.permission.check(url)) {
            //callback({ responseCode: 403, data: null }, false);
            if (window.tf)
              if (window.tf.events)
                if (window.tf.events.servicePermission)
                  window.tf.events.servicePermission(url, false, "local");
            return;
          }
          var strData = "";
          for (var key in data) {
            if (data.hasOwnProperty(key)) {
              if (strData.length > 0) strData += "&";
              strData += key + "=" + encodeURI(data[key]);
            }
          }
          if (strData.length > 0) strData = "?" + strData;
          if (showLoader) {
            loader.show($(".content-area")); //(showLoader);
          }
          var req = function (
            url,
            strData,
            callback,
            showLoader,
            async,
            completeCb
          ) {
            return $.ajax({
              url: tf.path.combine(tf.settings().serviceUrl, url + strData),
              type: "get",
              contentType: "application/json",
              async: async,
              beforeSend: function (xhr) {
                xhr.setRequestHeader(
                  "Authorization",
                  "Bearer " + tf.cookies.get("token")
                );
                xhr.setRequestHeader(
                  "WarehouseId",
                  localStorage.getItem("usersWarehouseId")
                );
              },
              success: function (d) {
                if (window.tf)
                  if (window.tf.events)
                    if (window.tf.events.servicePermission)
                      window.tf.events.servicePermission(url, true, "server");

                if (callback != null) {
                  callback(d, true);
                }
                if (showLoader) loader.hide(showLoader);
              },
              error: function (e, reason) {
                if (e.status == 401) {
                  tf.cookies.erase("token");
                  redirectToLogin();
                } else if (e.status == 403) {
                  if (window.tf)
                    if (window.tf.events)
                      if (window.tf.events.servicePermission)
                        window.tf.events.servicePermission(
                          url,
                          false,
                          "server"
                        );
                } else if (e.status == 404) {
                  snackbar.show("Resource Not found", "cs-danger");
                } else {
                  if (!navigator.onLine) {
                    snackbar.show(
                      "Network unavailable, please check your internet connection.",
                      "cs-danger"
                    );
                  }
                  // snackbar.show(
                  //   "Unexpected error in communicating to server",
                  //   "cs-danger"
                  // );
                  if (callback != null) {
                    callback(e, false, reason);
                  }
                }
                if (showLoader) loader.hide(showLoader);
              },
              complete: function (e, a) {
                if (completeCb) completeCb(e, a);
              },
            }); // ajax end
          };

          if (tf.token.expired()) {
            if (url == "account/login") {
              tf.token.renew(function () {
                return req(
                  url,
                  strData,
                  callback,
                  showLoader,
                  async,
                  completeCb
                );
              });
            } else {
              if (tf.cookies.get("isRefreshedToken") != null) {
                if (tf.cookies.get("isRefreshedToken").includes("false")) {
                  tf.token.refresh(function (response, token) {
                    if (response) {
                      tf.cookies.set("token", token);
                      tf.cookies.set("isRefreshedToken", JSON.stringify(true));
                      return req(
                        url,
                        strData,
                        callback,
                        showLoader,
                        async,
                        completeCb
                      );
                    } else {
                      tf.cookies.erase("token");
                      tf.cookies.erase("UserDetails");
                      redirectToLogin();
                      //snackbar.show("Invalid or Expired Token. Try login again", "cs-danger");
                    }
                  });
                } else {
                  tf.cookies.erase("token");
                  tf.cookies.erase("UserDetails");
                  tf.cookies.erase("isRefreshedToken");
                  redirectToLogin();
                  //snackbar.show("Invalid or Expired Token. Try login again", "cs-danger");
                }
              } else {
                tf.cookies.erase("token");
                tf.cookies.erase("UserDetails");
                tf.cookies.erase("isRefreshedToken");
                redirectToLogin();
              }
            }
          } else {
            return req(url, strData, callback, showLoader, async, completeCb);
          }
        },

        post: function (
          url,
          data,
          callback,
          showLoader = true,
          async = true,
          completeCb,
          contentType
        ) {
          if (!this.permission.check(url)) {
            if (window.tf)
              if (window.tf.events)
                if (window.tf.events.servicePermission)
                  window.tf.events.servicePermission(url, false, "local");

            return;
          }
          if (showLoader) {
            loader.show($(".content-area")); //loader.show(showLoader);
          }
          var req = function (
            url,
            data,
            callback,
            showLoader,
            async,
            completeCb,
            contentType = "application/json"
          ) {
            return $.ajax({
              url: tf.path.combine(tf.settings().serviceUrl, url),
              data: JSON.stringify(data),
              type: "post",
              async: async,
              beforeSend: function (xhr) {
                xhr.setRequestHeader(
                  "Authorization",
                  "Bearer " + tf.cookies.get("token")
                );
                xhr.setRequestHeader(
                  "WarehouseId",
                  localStorage.getItem("usersWarehouseId")
                );
              },
              contentType: contentType,
              success: function (d) {
                if (window.tf)
                  if (window.tf.events)
                    if (window.tf.events.servicePermission)
                      window.tf.events.servicePermission(url, true, "server");

                if (showLoader) loader.hide(showLoader);
                if (callback != null) {
                  callback(d, true);
                }
              },
              error: function (e) {
                if (showLoader) loader.hide(showLoader);
                if (e.status == 401) {
                  tf.cookies.erase("token");
                  redirectToLogin();
                } else if (e.status == 403) {
                  console.log("access denied to the API ", url);
                  if (window.tf)
                    if (window.tf.events)
                      if (window.tf.events.servicePermission)
                        window.tf.events.servicePermission(
                          url,
                          false,
                          "server"
                        );
                } else if (e.status == 404) {
                  snackbar.show("Resource Not found", "cs-danger");
                } else {
                  // snackbar.show(
                  //   "Unexpected error in communicating to server",
                  //   "cs-danger"
                  // );
                  if (callback != null) {
                    callback(e, false);
                  }
                }
              },
              complete: function (e, a) {
                if (completeCb) completeCb(e, a);
              },
            });
          };

          if (tf.token.expired()) {
            if (url == "account/login") {
              tf.token.renew(function () {
                req(
                  url,
                  data,
                  callback,
                  showLoader,
                  async,
                  completeCb,
                  contentType
                );
              });
            } else {
              if (tf.cookies.get("isRefreshedToken") != null) {
                if (tf.cookies.get("isRefreshedToken").includes("false")) {
                  tf.token.refresh(function (response, token) {
                    if (response) {
                      tf.cookies.set("token", token);
                      debugger;
                      tf.cookies.set("isRefreshedToken", JSON.stringify(true));
                      req(
                        url,
                        data,
                        callback,
                        showLoader,
                        async,
                        completeCb,
                        contentType
                      );
                    } else {
                      tf.cookies.erase("token");
                      tf.cookies.erase("UserDetails");
                      tf.cookies.erase("isRefreshedToken");
                      redirectToLogin();
                      //snackbar.show("Invalid or Expired Token. Try login again", "cs-danger");
                    }
                  });
                } else {
                  tf.cookies.erase("token");
                  tf.cookies.erase("UserDetails");
                  tf.cookies.erase("isRefreshedToken");
                  redirectToLogin();
                  //snackbar.show("Invalid or Expired Token. Try login again", "cs-danger");
                }
              } else {
                tf.cookies.erase("token");
                tf.cookies.erase("UserDetails");
                tf.cookies.erase("isRefreshedToken");
                redirectToLogin();
              }
            }
          } else {
            req(
              url,
              data,
              callback,
              showLoader,
              async,
              completeCb,
              contentType
            );
          }
        },
      };
    })();
    function redirectToLogin() {
      if (!tf.page.queryString.returnurl) {
        var curUrl = tf.page.fullUrl;
        if (curUrl) {
          tf.navigate("account?returnurl=" + encodeURIComponent(curUrl));
        } else {
          tf.navigate("account");
        }
      }
    }
  }
})();
