(function (window) {
  function thinFront() {
    var settings;
    var url_rewrite = null;
    var currentLayout = null;
    var curPage = null;
    var _pageperm = [];
    var cachedViews = {};
    var cachedLayouts = {};
    var _session = {};
    var oldHashChange = "";
    var methods = {
      init: function (options) {
        $.ajax({
          url: "settings.json",
          method: "get",
          success: function (data) {
            if (options != null) {
              settings = $.extend(options, data);
            } else {
              settings = data;
            }
            settings = $.extend(
              {
                home: "home",
                viewFolder: "pages",
                layouts: { home: "layout.html" },
              },
              settings
            );
            this.settings = settings;

            window.onhashchange = function (e) {
              var allowChange = handleNavigation(e.newURL, e.oldURL);
              if (!allowChange) {
                oldHashChange = e.oldURL;
                window.location.href = e.oldURL;
              } else {
                oldHashChange = "";
              }
            };

            handleNavigation();
          },
          cache: false,
        });
        $.ajax({
          url: "url_rewrite.json",
          method: "get",
          success: function (data) {
            url_rewrite = data;
          },
        });
      },
      navigate: function (url) {
        if (url == "/") {
          window.location.href = window.location.origin;
        } else {
          window.location.href =
            window.location.origin + window.location.pathname + "#" + url;
        }
      },
      page: function () {
        return curPage;
      },
      path: {
        combine: function () {
          var urlStr = "";
          for (x = 0; x < arguments.length; x++) {
            if (urlStr.length > 0) urlStr += "/";
            urlStr += arguments[x];
          }
          return urlStr;
        },
      },
      settings: function () {
        return settings;
      },
      cookies: {
        set: function (name, value, days) {
          var expires = "";
          if (days) {
            var date = new Date();
            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
            expires = "; expires=" + date.toUTCString();
          }
          document.cookie = name + "=" + (value || "") + expires + "; path=/";
        },
        get: function (name) {
          var nameEQ = name + "=";
          var ca = document.cookie.split(";");
          for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == " ") c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0)
              return c.substring(nameEQ.length, c.length);
          }
          return null;
        },
        erase: function (name) {
          document.cookie = name + "=; Max-Age=-99999999; path=/";
        },
      },
      binder: {
        scatter: function (data, selector) {
          $(selector)
            .find("[data-repeat]")
            .each(function (i, o) {
              var repContainer = $(o);
              var attrVal = repContainer.attr("data-repeat");
              var cData;
              if (attrVal.includes(".")) {
                cData = data[attrVal.split(".")[0]];
                attrVal = attrVal.split(".")[1];
              }
              if (!cData) {
                cData = [];
              }
              var items = cData[attrVal];
              var template = repContainer.children()[0].outerHTML;
              repContainer.empty();
              if (
                items == undefined ||
                items.length == "undefined" ||
                items.length == 0
              ) {
                var itemObj = $(template);
                repContainer.append(itemObj);
                itemObj.hide();
                repContainer.data("empty", true);
              } else {
                var x = 0;
                for (x = 0; x < items.length; x++) {
                  var itemObj = $(template);
                  var itemVal = items[x];
                  itemObj.attr("data-row", x);
                  var hasIf = itemObj.attr("data-if");
                  if (itemObj.attr("data-repeat-item")) {
                    evalBindExp(
                      itemObj.attr("data-repeat-item"),
                      itemVal,
                      itemObj
                    );
                  }
                  var ifval = evalif(hasIf, cData);
                  if (ifval) {
                    itemObj.find("[data-repeat-item]").each(function (ci, co) {
                      co = $(co);
                      var propname = co.attr("data-repeat-item");
                      var multiProp = propname.split("|");
                      multiProp.forEach((element) => {
                        evalBindExp(element, itemVal, co);
                      });
                    });
                  }

                  repContainer.append(itemObj);
                  itemObj.show();
                  repContainer.data("empty", false);
                }
              }
            });
          $(selector)
            .find("[data-bind]")
            .each(function (i, o) {
              var obj = $(o);
              var propname = obj.attr("data-bind");
              var hasIf = obj.attr("data-if");
              var ifval = evalif(hasIf, data);
              if (ifval) {
                var multiProp = propname.split("|");
                multiProp.forEach((element) => {
                  evalBindExp(element, data, obj);
                });
              }
            });
        },
        gather: function (selector, data) {
          $(selector)
            .find("[data-bind]")
            .each(function (i, o) {
              var obj = $(o);
              var v =
                obj[0].tagName.toLowerCase() == "input" ||
                obj[0].tagName.toLowerCase() == "select"
                  ? obj.val()
                  : obj.text();
              data[obj.attr("data-bind")] = v;
            });
          $(selector)
            .find("[data-repeat]")
            .each(function (i, o) {
              var repContainer = $(o);
              if (repContainer.data("empty") == true) {
                data[repContainer.attr("data-repeat")] = [];
                return;
              }
              var items = data[repContainer.attr("data-repeat")];
              var x = 0;
              repContainer.find("[data-row]").each(function (ri, ro) {
                ro = $(ro);
                ro.find("[data-repeat-item]").each(function (ci, co) {
                  co = $(co);
                  var cv =
                    co[0].tagName.toLowerCase() == "input" ||
                    co[0].tagName.toLowerCase() == "select"
                      ? co.val()
                      : co.text();
                  if (data[repContainer.attr("data-repeat")] == null)
                    data[repContainer.attr("data-repeat")] = [];
                  if (data[repContainer.attr("data-repeat")].length <= x)
                    data[repContainer.attr("data-repeat")].push({});
                  var propName = co.attr("data-repeat-item");
                  propName = propName.split("|")[0];
                  data[repContainer.attr("data-repeat")][x][propName] = cv;
                });
                x++;
              });
            });
        },
      },
      session: {
        values: {},
        clear: function () {
          localStorage.setItem("tf__session", "");
        },
      },
      viewState: {},
      process: {
        attach: function (process) {
          if (process instanceof TFProcess) {
            this.list.push(process);
            process.start();
          }
        },
        list: [],
      },
      security: {
        pagePermission: (function () {
          _pageperm = JSON.parse(localStorage.getItem("__pagePerm"));
          if (!_pageperm) _pageperm = [];
          return {
            defaultPerm: true,
            set: function (controller, action, perm, activities) {
              if (!controller || !action || !perm) {
                console.error("invalid parameters");
                return;
              }
              if (perm != "allow" && perm != "deny") {
                console.error(
                  "invalid permission type, only 'allow' or 'deny' is permitted"
                );
                return;
              }
              var existing = this.find(controller, action);
              if (existing) {
                existing.type = perm;
                existing.activities = activities;
              } else {
                _pageperm.push({
                  cont: controller,
                  act: action,
                  type: perm,
                  activities: activities,
                });
              }
              localStorage.setItem("__pagePerm", JSON.stringify(_pageperm));
            },
            find: function (controller, action, exact = true) {
              var perm = null;
              for (let x = 0; x < _pageperm.length; x++) {
                var element = _pageperm[x];

                element.cont = element.cont.toLowerCase().trim();
                controller = controller.toLowerCase().trim();
                action = action.toLowerCase().trim();
                element.act = element.act.toLowerCase().trim();
                if (
                  element.cont == controller &&
                  (element.act == action ||
                    element.act == (exact == true ? action : "*"))
                ) {
                  perm = element;
                  break;
                }
              }
              return perm;
            },
            get: function (controller, action, def) {
              var defPerm = {
                cont: controller,
                act: action,
                type: def ? def : this.defaultPerm ? "allow" : "deny",
                activities: [],
              };
              if (_pageperm.length == 0) {
                return defPerm;
              } else {
                var spec = this.find(controller, action);
                if (spec) {
                  return spec;
                } else {
                  var gen = this.find(controller, action, false);
                  if (gen) {
                    return gen;
                  } else {
                    return defPerm;
                  }
                }
              }
            },
            check: function (controller, action, def) {
              if (_pageperm.length == 0) {
                return def ? def : this.defaultPerm;
              } else {
                var spec = this.find(controller, action);
                if (spec) {
                  return spec.type == "allow" ? true : false;
                } else {
                  var gen = this.find(controller, action, false);
                  if (gen) {
                    return gen.type == "allow" ? true : false;
                  } else {
                    return def ? def : this.defaultPerm;
                  }
                }
              }
            },

            clear: function () {
              _pageperm = [];
              localStorage.setItem("__pagePerm", JSON.stringify(_pageperm));
            },
          };
        })(),
      },
      user: {
        loggedIn: function (userInfo, accessToken, refreshToken) {
          if (settings.authType == "JWT") {
            userInfo = parseJWT(accessToken);
            delete userInfo.iat;
            delete userInfo.exp;
            delete userInfo.credValid;
          }
          localStorage.setItem("userInfo", JSON.stringify(userInfo));
          tf.cookies.set("accessToken", accessToken);
          tf.cookies.set("refreshToken", refreshToken);
          // localStorage.setItem("accessToken", accessToken);
          // localStorage.setItem("refreshToken", refreshToken);
        },
        isLoggedIn: function () {
          if (settings.requireLogin) {
            // console.log("login required");
            var authT = tf.cookies.get("accessToken");
            var refT = tf.cookies.get("refreshToken");
            if (authT) {
              // console.log("already has token");
              if (settings.authType == "JWT") {
                var curDate = new Date();
                var expDate = new Date(parseJWT(authT).exp * 1000);
                if (expDate > curDate) {
                  // console.log("token is valid");
                  tf.user.loggedIn(null, authT, refT);
                  return true;
                } else {
                  console.log("token is expired, checking refresh token");
                  var curDate = new Date();
                  var expDate = new Date(parseJWT(refT).exp * 1000);
                  if (expDate > curDate) {
                    console.log("refresh token is valid, renewing the token");
                    this.refreshToken();
                    return true;
                  } else {
                    console.log(
                      "refresh token is also expired, redirecting to login"
                    );
                    return false;
                  }
                }
              }
            } else {
              console.log("token not available");
              return false;
            }
          } else {
            console.log("login not required");
            return true;
          }
        },
        refreshToken: function () {
          var res = false;
          var data = JSON.stringify({ refreshToken: this.getRefreshToken() });
          $.ajax({
            url: tf.path.combine(settings.serviceUrl, settings.refTokenUrl),
            method: "POST",
            async: false,
            data: data,
            contentType: "application/json",
            beforeSend: function (xhr) {
              xhr.setRequestHeader(
                "Authorization",
                "Bearer " + tf.cookies.get("accessToken")
              );
            },
            success: function (d) {
              if (d.success) {
                tf.user.loggedIn(
                  null,
                  d.data.tokens.accessToken,
                  d.data.tokens.refreshToken
                );
                res = true;
              } else {
                res = false;
              }
            },
            error: function (d) {
              res = false;
            },
          });
          return res;
        },
        getToken: function () {
          return tf.cookies.get("accessToken");
        },
        getRefreshToken: function () {
          return tf.cookies.get("refreshToken");
        },
        getInfo: function () {
          return JSON.parse(localStorage.getItem("userInfo"));
        },
        logout: function () {
          localStorage.removeItem("userInfo");
          tf.cookies.erase("accessToken");
          tf.cookies.erase("refreshToken");
          tf.navigate("/");
        },
      },
      loadScript: function (scriptSrc, async = true, onLoad) {
        let scriptEle = document.createElement("script");
        scriptEle.setAttribute("src", scriptSrc);
        scriptEle.setAttribute("type", "text/javascript");
        scriptEle.setAttribute("async", async);
        document.body.appendChild(scriptEle);
        // success event
        scriptEle.addEventListener("load", () => {
          console.log("File loaded");
          if (onLoad) onLoad();
        });
        // error event
        scriptEle.addEventListener("error", (ev) => {
          console.log("Error on loading file", ev);
        });
      },
    };

    try {
      _session = JSON.parse(localStorage.getItem("tf__session"));
      if (!_session) _session = {};
    } catch (e) {
      _session = {};
    }

    methods.session.values = new Proxy(_session, {
      get: function (target, prop) {
        return Reflect.get(target, prop);
      },
      set: function (target, prop, value) {
        Reflect.set(target, prop, value);
        localStorage.setItem("tf__session", JSON.stringify(_session));
      },
    });

    function applyPageActivityPermission(view, perm) {
      for (x = 0; x < perm.activities.length; x++) {
        var p = perm.activities[x];
        var obj = view.find("[permission=" + p.activity + "]");
        if (p.permission == "true" || p.permission == "false")
          p.permission = p.permission == "true";
        if (typeof p.permission == "string") {
          var attrs = p.permission.split(";");
          for (y = 0; y < attrs.length; y++) {
            var att = attrs[y].split("=")[0];
            var attv = attrs[y].split("=")[1];
            if (att == "value") {
              obj.val(attv);
            } else if (att == "text") {
              obj.text(attv);
            } else if (att == "class") {
              obj.addClass(attv);
            } else {
              obj.attr(att, attv);
            }
          }
        } else {
          if (!p.permission) {
            obj.remove();
          }
        }
      }
    }
    function findHashPart(url) {
      var hasPart = url.split("#");
      var ret = "";
      if (hasPart.length > 1) {
        ret = hasPart[1];
      } else {
        ret = "/";
      }
      return ret;
    }

    function parseJWT(token) {
      var base64Url = token.split(".")[1];
      var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      var jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      jsonPayload = JSON.parse(jsonPayload);
      return jsonPayload;
    }
    function evalif(exp, data) {
      try {
        for (var key in data) {
          if (data.hasOwnProperty(key)) {
            var re = new RegExp("{" + key + "}", "g");
            exp = exp.replace(re, data[key]);
          }
        }
        var comp = true;

        comp = eval(exp);
      } catch (ex) {
        comp = true;
      }
      return comp;
    }
    function evalBindExp(bindExp, data, elem) {
      // debugger;
      var expPart = bindExp.split("~");
      var attr = "";
      var propName = expPart[0];
      if (expPart.length > 1) {
        attr = expPart[0];
        propName = expPart[1];
      }
      var props = propName.split("+");
      var propVal = "";
      var y = 0;
      var propFound = false;
      if (data) {
        for (y = 0; y < props.length; y++) {
          if (data.hasOwnProperty(props[y])) {
            // if (data[props[y]]) propVal += data[props[y]];
            if (data[props[y]] != null) propVal += data[props[y]];
            propFound = true;
          }
        }
        if (!propFound) {
          try {
            var exp = propName;
            for (var key in data) {
              if (data.hasOwnProperty(key)) {
                var re = new RegExp("{" + key + "}", "g");
                exp = exp.replace(re, data[key]);
              }
            }
            propVal = eval(exp);
          } catch (ex) {}
        }
      }

      // if (elem.is("[date]")) {
      //   var dateFormat = JSON.parse(tf.session.values["_organizationData"])[0]
      //     .DateFormat;
      //   propVal = moment(propVal).format(dateFormat);
      // }
      if (
        elem[0].tagName.toLowerCase() == "input" ||
        elem[0].tagName.toLowerCase() == "select"
      ) {
        if (attr == "" || attr == "value") {
          if (elem[0].tagName.toLowerCase() == "input") {
            elem.val(propVal);
          } else if (propVal != "") {
            elem.val(propVal);
          }
        } else {
          elem.attr(attr, propVal);
        }
      } else {
        if (attr == "" || attr == "value") elem.text(propVal);
        else if (attr == "class") {
          elem.addClass(propVal);
        } else {
          if (attr != "stylebg") {
            elem.attr(attr, propVal);
          } else {
            // elem.css("background-image", propVal);
            if (propVal != "") {
              $(elem).attr("style", "background-image:url(" + propVal + ")");
            } else {
              $(elem).attr(
                "style",
                "background-image:url('assets/images/productimage.jpg')"
              );
            }
          }
        }
      }
    }

    function handleNavigation(newUrl, oldUrl) {
      if (oldHashChange != newUrl) {
        if (newUrl) {
          if (tf.page.unload) {
            console.log("page unload");
            var oldac = parseNavUrl(findHashPart(newUrl));
            var newac = parseNavUrl(findHashPart(oldUrl));
            var res = tf.page.unload(oldac, newac);
            if (!res) {
              return false;
            }
          }
        }
      } else {
        return true;
      }
      if (settings != null) {
        var link = window.location.hash;
        if (link.startsWith("#")) {
          link = link.substr(1, link.length - 1);
        }
        var urlObj = parseNavUrl(link, oldUrl);
        var loggedIn = tf.user.isLoggedIn();
        if (!loggedIn) {
          var loginUrl = parseNavUrl(settings.loginUrl);
          if (
            loginUrl.controller == urlObj.controller &&
            loginUrl.action == urlObj.action
          ) {
            loggedIn = true;
          } else {
            var ispublic = false;
            if (settings.publicUrls) {
              for (var u = 0; u < settings.publicUrls.length; u++) {
                var pu = settings.publicUrls[u];
                pu = parseNavUrl(pu);
                if (
                  pu.controller == urlObj.controller &&
                  pu.action == urlObj.action
                ) {
                  ispublic = true;
                  break;
                }
              }
            }
            if (ispublic) {
              loggedIn = true;
            } else {
              tf.navigate(settings.loginUrl);
            }
          }
        }
        if (loggedIn) {
          var permCheck = true;
          if (settings.securePages) {
            permCheck = methods.security.pagePermission.check(
              urlObj.controller,
              urlObj.action
            );
          }
          if (permCheck) {
            methods.page = urlObj;
            renderView(methods.page.url);
          }
          if (tf.events)
            if (tf.events.pagePermission)
              methods.events.pagePermission(urlObj, permCheck);
        }
      }
      return true;
    }

    function loadLayout(layout, callback) {
      if (currentLayout == layout) {
        if (callback != null && typeof callback == "function") {
          callback();
          return;
        }
      } else if (layout != "" && layout != null) {
        if (
          tf.events != null &&
          tf.events.beforeLayoutRender != null &&
          typeof tf.events.beforeLayoutRender == "function"
        )
          tf.events.beforeLayoutRender(layout);

        $.ajax({
          url: methods.path.combine("layouts", settings.layouts[layout]),
          method: "get",
          success: function (data) {
            data = $(data);
            var layoutDiv = $("#__app_layout");
            layoutDiv.empty();
            layoutDiv.append(data);
            includeHTML("layout");
            clearScripts("layout");
            loadScripts(data, "layout");
            currentLayout = layout;
            if (callback != null && typeof callback == "function") {
              callback();
            }
            if (
              tf.events != null &&
              tf.events.afterLayoutRender != null &&
              typeof tf.events.afterLayoutRender == "function"
            )
              tf.events.afterLayoutRender(layout);
          },
          cache: settings.allowBrowserCache,
        });
      } else {
        currentLayout = "";
        callback();
      }
    }

    function parseNavUrl(link, oldurl) {
      var urlParts = link.split("?");
      urlParts[0] = translate_url(urlParts[0]);
      if (urlParts[0] == "") urlParts[0] = settings.home;
      var path = urlParts[0].split("/");
      var controller = path[0] == "" ? settings.home : path[0];
      var action = "index";
      var args = [];
      var qStr = {};
      var oldLayout = tf.page.layout;
      if (path.length > 1) {
        if (isNaN(path[1])) {
          action = path[1];
          path.slice(2).forEach((element) => {
            if (element != "") args.push(element);
          });
        } else {
          path.slice(1).forEach((element) => {
            if (element != "") args.push(element);
          });
        }
      }
      if (urlParts.length > 1) {
        urlParts[1].split("&").forEach((q) => {
          var qparts = q.split("=");
          qStr[qparts[0]] = decodeURI(qparts[1]);
        });
      }
      if (oldurl == undefined) {
        oldurl = "";
      }
      return new pageObject({
        controller: controller,
        action: action,
        url: controller + "/" + action + ".html",
        args: args,
        queryString: qStr,
        fullUrl: link,
        layout: oldLayout,
        rebuildUrl: function () {
          var url = "";
          url += controller + "/" + action;
          url += this.args.join("/");
          var qs = "";
          for (key in this.queryString) {
            qs += key + "=" + this.queryString[key];
          }
          if (qs.length > 0) qs = "?" + qs;
          url += qs;
          return url;
        },
        loadPartialView: function (viewUrl, container, callback) {
          if (!viewUrl.endsWith(".html")) viewUrl += ".html";
          if (typeof container === "string") {
            container = $(container);
          }
          renderPartialView(viewUrl, container, callback);
        },
        prevURL: findHashPart(oldurl),
      });
    }
    function clearScripts(scope) {
      $("#__" + scope + "_scripts").empty();
    }
    function loadScripts(htmlContent, scope) {
      var mainTag = $("<div></div>");
      mainTag.append(htmlContent.clone());
      var scrArray = mainTag.find("script");
      scrArray.each(function (idx, element) {
        element = $(element);
        if (element.attr("src")) {
          var srcPath = element.attr("src");
          if ($("#__" + scope + "_scripts").length == 0) {
            $("body").append("<script id='__" + scope + "_scripts'></script>");
          }
          if (
            $("#__" + scope + "_scripts").find("script[src='" + srcPath + "']")
              .length == 0
          ) {
            var newSrc = $("<script></script>");
            $("#__" + scope + "_scripts").append(newSrc);
            newSrc.attr(
              "src",
              srcPath +
                (settings.allowBrowserCache ? "" : "?_=" + new Date().getTime())
            );
          }
        } else {
          eval(element.innerHTML);
        }
        // element.remove();
      });
    }

    function translate_url(url) {
      var newUrl = url;
      if (url_rewrite != null) {
        url_rewrite.forEach((rewrite) => {
          if (rewrite.source == url) {
            newUrl = rewrite.target;
            return;
          }
        });
      }
      return newUrl;
    }

    function renderView(viewUrl, pagePerm) {
      //console.clear();
      viewUrl = settings.viewFolder + "/" + viewUrl;
      var _render = function (html) {
        var viewObj = $(html);
        var layout = viewObj.attr("app-layout");
        var newTitle =
          (viewObj.attr("app-title") != "" &&
          viewObj.attr("app-title") != undefined
            ? viewObj.attr("app-title") + " - "
            : "") +
          (settings.applicationTitle != "" &&
          settings.applicationTitle != undefined
            ? settings.applicationTitle
            : "");

        if (newTitle) document.title = newTitle;
        var moveViewToLayout = function () {
          if (layout == null || layout == "") {
            $("#__app_layout").empty();
          }
          var container = $('[container="view"]');
          if (container.length == 0) container = $("#__app_layout");
          container.empty();

          clearScripts("view");
          // var thtml = $("<div></div>");
          // thtml.append(viewObj.clone());
          // thtml.find("script").remove();
          container.append(viewObj);
          container.find("script").remove();
          loadScripts(viewObj, "view");
          includeHTML("view");
          setDefaultState();
          if (
            methods.page.ready != undefined &&
            typeof methods.page.ready == "function"
          ) {
            methods.page.ready();
          }
        };
        methods.viewState = {};
        if (
          tf.events != null &&
          tf.events.beforeViewRender != null &&
          typeof tf.events.beforeViewRender == "function"
        )
          tf.events.beforeViewRender(viewUrl);
        if (methods.page.layout != layout) {
          methods.page.layout = layout;
          loadLayout(layout, moveViewToLayout);
          console.log("layout loaded");
        } else {
          console.log("used existingn layout");
          moveViewToLayout();
        }
        if (
          tf.events != null &&
          tf.events.afterViewRender != null &&
          typeof tf.events.afterViewRender == "function"
        )
          tf.events.afterViewRender(viewUrl);
      };
      if (cachedViews[viewUrl] != null) {
        html = cachedViews[viewUrl];
        _render(html);
        return;
      }
      $.ajax({
        url: viewUrl.toLowerCase(),
        method: "get",
        success: function (html) {
          cachedViews[viewUrl] = html;
          _render(html);
        },
        error: function (data, abc) {
          //console.log(data);
          if (data.status == 404) {
            data = "<h1>Not Found</h1><p><h5>" + viewUrl + "</h5>";
          }
          var container = $('[container="view"]');
          if (container.length == 0) container = $("#__app_layout");
          if (container.length == 0) container = $("body");
          //currentLayout = null;
          container.empty();
          container.append(data);
        },
        cache: settings.allowBrowserCache,
      });
    }

    function renderPartialView(viewUrl, container, callback) {
      viewUrl = settings.viewFolder + "/" + viewUrl;
      var _render = function (html) {
        var viewObj = $(html);

        container.empty();
        //clearScripts("view");
        container.append(viewObj);
        //        container.find("script").remove();
        //        loadScripts(viewObj, "view");
        includeHTML("view");
      };

      if (cachedViews[viewUrl] != null) {
        html = cachedViews[viewUrl];
        _render(html);
        return;
      }
      $.ajax({
        url: viewUrl.toLowerCase(),
        method: "get",
        success: function (html) {
          cachedViews[viewUrl] = html;
          _render(html);
          if (callback) {
            callback();
          }
        },
        error: function (data) {
          if (data.status == 404) {
            data = "<h1>Not Found</h1><p><h5>" + viewUrl + "</h5>";
          }
          container.empty();
          container.append(data);
        },
        cache: settings.allowBrowserCache,
      });
    }

    function setDefaultState() {
      var defState = methods.page.queryString.__page_state;
      if (!defState) {
        var states = $(document).find("[page-state]");
        if (states.length > 0) {
          defState = $(states[0]).attr("page-state");
        }
      }
      if (defState) {
        methods.page.setState(defState);
      }
    }

    function includeHTML(scope) {
      var _all_elements = $("[include-html]"); //  document.getElementsByTagName("*");
      _all_elements.each(function (i, e) {
        var file = settings.viewFolder + "/" + $(e).attr("include-html");
        $(e).removeAttr("include-html");
        if (file) {
          $.ajax({
            url: file,
            method: "get",
            success: function (html) {
              html = $(html);
              loadScripts(html, scope);
              var thtml = $("<div></div>");
              thtml.append(html);
              thtml.find("script").remove();
              $(e).append(thtml);
              includeHTML(scope);
            },
            cache: settings.allowBrowserCache,
          });
          return;
        }
      });
    }

    var pageObject = function (obj) {
      var curState = "";
      var PrevState = "";
      var ret = $.extend(obj, {
        setState: function (state) {
          $("[page-state]").hide();
          $("[page-state=" + state + "]").show();
          PrevState = curState;
          curState = state;
        },
        currentState: function () {
          return curState;
        },
        prevState: function () {
          return PrevState;
        },
      });
      return ret;
    };

    return methods;
  }
  function initService() {
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
                    tf
                      .settings()
                      .loginAPIUrls.filter((e) => e.Name === this.url).length ==
                      0
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
              tf.settings().loginAPIUrls.filter((e) => e.Name === url).length >
                0
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
    } else {
      console.log("tf is not defined");
    }
  }

  if (typeof window.tf === "undefined") {
    window.tf = new thinFront();
    initService();
  }

  window.onclick = function (e) {
    if (e.target.tagName.toLowerCase() == "a") {
      if ($(e.target).attr("href") == "#") {
        e.preventDefault();
      }
    }
  };

  window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
      // If the page was loaded from cache (back button), refresh the page
      window.location.reload();
    }
  });

  // $(body).unload(function () {
  //   console.log("unload event");
  // });
})(window);
