(function () {
  var _service_perm;
  var _svc;
  if (typeof window.tf !== "undefined") {
    window.tf.service = (function () {
      _svc = {
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
        call: function (
          method,
          url,
          data,
          callback,
          async,
          contentType,
          complete,
          showLoader
        ) {
          if (!this.permission.check(url)) {
            if (window.tf)
              if (window.tf.events)
                if (window.tf.events.servicePermission)
                  window.tf.events.servicePermission(url, false, "local");

            return;
          }
          if (showLoader == undefined) showLoader = this.showLoader;
          if (showLoader) {
            if (this.loader) {
              this.loader.show();
            }
          }
          var req = function (
            method,
            url,
            data,
            callback,
            async = true,
            contentType = "application/json",
            complete
          ) {
            //debugger;
            return $.ajax({
              url: tf.path.combine(tf.settings().serviceUrl, url),
              data: data ? JSON.stringify(data) : "",
              type: method,
              async: async,
              beforeSend: function (xhr) {
                if (
                  tf.settings().requireLogin &&
                  tf.settings().loginAPIUrls.filter((e) => e.Name === this.url)
                    .length == 0
                ) {
                  xhr = genReqHeader(xhr);
                }
              },
              contentType: contentType,
              success: function (d) {
                if (window.tf)
                  if (window.tf.events)
                    if (window.tf.events.servicePermission)
                      window.tf.events.servicePermission(url, true, "server");

                if (this.showLoader) {
                  if (this.loader) {
                    this.loader.hide();
                  }
                }
                if (callback != null) {
                  callback(d, true);
                }
              },
              error: function (e) {
                if (showLoader) {
                  if (this.loader) {
                    this.loader.hide();
                  }
                }
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
                  // show resource not found message
                } else {
                  if (callback != null) {
                    callback(e, false);
                  }
                }
              },
              complete: function (e, a) {
                //debugger;
                if (showLoader) {
                  if (tf.service.loader) {
                    tf.service.loader.hide();
                  }
                }
                if (complete) complete(e, a);
              },
            });
          };
          if (
            !tf.user.isLoggedIn() &&
            tf.settings().loginAPIUrls.filter((e) => e.Name === url).length > 0
          ) {
            if (tf.settings().loginUrl) {
              redirectToLogin();
            }
          } else {
            return req(
              method,
              url,
              data,
              callback,
              async,
              contentType,
              complete
            );
          }
        },
        get: function (url, data, callback, options) {
          if (typeof data === "function") {
            options = callback;
            callback = data;
            data = null;
          }
          if (!options) options = {};
          var d = "";
          if (data) {
            //debugger;
            for (var propt in data) {
              if (d.length > 0) d += "&";
              d += propt + "=" + encodeURI(data[propt]);
            }
            if (url.indexOf("?") < 0) {
              url += "?" + d;
            } else {
              url += "&" + d;
            }
          }
          return this.call(
            "get",
            url,
            null,
            callback,
            options.async,
            options.contentType,
            options.complete,
            options.showLoader
          );
        },
        post: function (url, data, callback, options) {
          if (!options) options = {};

          if (typeof data === "function") {
            callback = data;
            data = null;
          }
          return this.call(
            "post",
            url,
            data,
            callback,
            options.async,
            options.contentType,
            options.complete,
            options.showLoader
          );
        },
      };
      return _svc;
    })();
    function genReqHeader(xhr) {
      if (tf.settings().authType.toLowerCase() == "basic") {
        xhr.setRequestHeader(
          "Authorization",
          "Basic " + tf.cookies.get("token")
        );
      } else if (tf.settings().authType.toLowerCase() == "jwt") {
        xhr.setRequestHeader(
          "Authorization",
          "Bearer " + tf.cookies.get("accessToken") //localStorage.getItem("accessToken")
        );
      } else {
      }
      return xhr;
    }
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
