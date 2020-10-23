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
        window.location.href =
          window.location.origin + window.location.pathname + "#" + url;
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
      bindDataTable: function (
        obj,
        url,
        columns,
        initComplete,
        adddata,
        defaultorder
      ) {
        return $(obj).DataTable({
          processing: true,
          serverSide: true,
          dom:
            "<'datatable-header'<'left-part'<'coloumn_filter' B>><'right-part' <'search_datacs' f>>><'datatable-content't><'datatable-footer'<'left-part'l><'right-part'p>>",
          stateSave: true,
          stateSaveParams: function (settings, data) {
            data.search.search = "";
            data.length = tf.settings().DatatableItems;
            data.start = 0;
          },
          language: {
            buttons: {
              colvisRestore: "Reset",
            },
          },
          pageLength: tf.settings().DatatableItems,
          buttons: [
            {
              extend: "colvis",
              text: "Display",
              columns: ":not(.skipth)",
              postfixButtons: ["colvisRestore"],
            },
          ],
          // colReorder: {
          //   fixedColumnsRight: 1
          // },
          drawCallback: function (settings, json) {
            //console.log(settings, json);
            var tbl = settings.nTable;
            initComplete(tbl);
          },
          initComplete: function (settings, json) {
            var tbl = settings.nTable;
            var tblObj = $(tbl).DataTable();
            var wrapper = $(tbl).closest(".dataTables_wrapper");
            var searchBox = wrapper.find(
              ".dataTables_filter input[type=search]"
            );
            searchBox
              .unbind() // Unbind previous default bindings
              .bind("input", function (e) {
                // Bind our desired behavior
                // If the length is 3 or more characters, or the user pressed ENTER, search
                if (this.value.length >= 3 || e.keyCode == 13) {
                  // Call the API search function
                  tblObj.search(this.value).draw();
                }
                // Ensure we clear the search if they backspace far enough
                if (this.value == "") {
                  tblObj.search("").draw();
                }
                return;
              });
          },
          ajax: function (data, callback, settings) {
            data = $.extend(
              data,
              adddata != null
                ? typeof adddata === "function"
                  ? adddata()
                  : adddata
                : {}
            );

            tf.service.post(url, data, function (d, success) {
              if (!success || (success && d.responseCode > 0)) {
                if (d.responseMessage == null) {
                  snackbar.show(d.data[0].errorMessage, "cs-danger");
                } else {
                  snackbar.show(d.responseMessage, "cs-danger");
                }
                d = {
                  draw: 1,
                  recordsTotal: 0,
                  recordsFiltered: 0,
                  data: [],
                };
              } else callback(d.data);
            });
          },
          columnDefs: columns,
          order: defaultorder ? defaultorder : [[1, "desc"]],
        });
      },
      binder: {
        scatter: function (data, selector) {
          $(selector)
            .find("[data-repeat]")
            .each(function (i, o) {
              var repContainer = $(o);
              var items = data[repContainer.attr("data-repeat")];
              var template = repContainer.children()[0].outerHTML;
              repContainer.empty();
              if (items.length == "undefined" || items.length == 0) {
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
                  itemObj.find("[data-repeat-item]").each(function (ci, co) {
                    co = $(co);
                    var propname = co.attr("data-repeat-item");
                    var multiProp = propname.split("|");
                    multiProp.forEach((element) => {
                      evalBindExp(element, itemVal, co);
                    });
                  });

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
              var multiProp = propname.split("|");
              multiProp.forEach((element) => {
                evalBindExp(element, data, obj);
              });
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
      tree: function () {
        function prepareItems(menu, items, options, issub) {
          $(items).each(function (i, o) {
            var __item = "";
            if (options.render) {
              __item = options.render(o);
            }
            if (__item == "" || __item == undefined || __item == null) {
              __item = $("<li></li>");
              var __item_anchor = $(
                "<a href='" +
                  o[options.value] +
                  "'>" +
                  o[options.display] +
                  "</a>"
              );
              __item.append(__item_anchor);
            }
            if (o.children != null && Array.isArray(o.children)) {
              var __sub = $("<ul class='sub-menu'></ul>");
              __item.append(__sub);
              __item.addClass("has-sub");
              __item.find("a").removeAttr("href");
              prepareItems(__sub, o.children, options, true);
            }
            menu.append(__item);
          });
        }
        return {
          bind: function (data, options) {
            if (
              options.target != null &&
              options.target != undefined &&
              options.target != ""
            ) {
              var __target = $(options.target);
              var __menu = __target;
              if (__target[0].tagName.toLowerCase() != "ul") {
                __menu = $("<ul></ul>");
                __target.append(__menu);
              }
              prepareItems(__menu, data, options, false);
            }
          },
        };
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
            set: function (controller, action, perm) {
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
              } else {
                _pageperm.push({ cont: controller, act: action, type: perm });
              }
              localStorage.setItem("__pagePerm", JSON.stringify(_pageperm));
            },
            find: function (controller, action, exact = true) {
              var perm = null;
              for (let x = 0; x < _pageperm.length; x++) {
                var element = _pageperm[x];
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
      token: {
        parse: function () {
          if (this.exists()) {
            var token = this.extract();
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
            return JSON.parse(jsonPayload);
          } else {
            return null;
          }
        },
        exists: function () {
          var token = this.extract();
          if (token) return true;
          else return false;
        },
        extract: function () {
          var token = tf.cookies.get("token");
          return token;
        },
        expired: function () {
          var parsed = this.parse();
          var timeToGetRefreshTokenBeforeExpiry = 0;

          if (tf.settings().timeToGetRefreshTokenBeforeExpiry != undefined) {
            timeToGetRefreshTokenBeforeExpiry = tf.settings()
              .timeToGetRefreshTokenBeforeExpiry;
          }

          if (!parsed) {
            return true;
          }

          if (
            Date.now() >=
            parsed.exp * 1000 - timeToGetRefreshTokenBeforeExpiry
          ) {
            // renew token before 1 mins of token expiry
            return true;
          } else {
            return false;
          }
        },
        renew: function (callback) {
          //var refToken = this.refresh();
          //console.log("token has expired you need to implement renew call");
          callback();
        },

        refresh: function (callback) {
          var data = { accessToken: tf.cookies.get("token") };
          return $.ajax({
            url: tf.path.combine(
              tf.settings().serviceUrl,
              "account/RefreshToken"
            ),
            data: JSON.stringify(data),
            type: "post",
            async: true,
            contentType: "application/json",
            success: function (d) {
              if (d.responseCode == 0) {
                callback(true, d.data);
              } else {
                callback(false, null);
              }
            },
          });
        },
      },
      user: function () {
        return getCurrentUser();
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

    function getCurrentUser() {
      JSON.parse(tf.cookies.get("userData"));
    }

    function evalBindExp(bindExp, data, elem) {
      var expPart = bindExp.split(":");
      var attr = "";
      var propName = expPart[0];
      if (expPart.length > 1) {
        attr = expPart[0];
        propName = expPart[1];
      }
      var props = propName.split("+");
      var propVal = "";
      var y = 0;
      if (data) {
        for (y = 0; y < props.length; y++) {
          if (data.hasOwnProperty(props[y])) {
            // if (data[props[y]]) propVal += data[props[y]];
            if (data[props[y]] != null) propVal += data[props[y]];
          }
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
        if (attr == "") elem.val(propVal);
        else elem.attr(attr, propVal);
      } else {
        if (attr == "") elem.text(propVal);
        else elem.attr(attr, propVal);
      }
    }

    function handleNavigation(newUrl, oldUrl) {
      if (oldHashChange != newUrl) {
        if (newUrl) {
          if (tf.page.unload) {
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
        var urlObj = parseNavUrl(link);
        var permCheck = methods.security.pagePermission.check(
          urlObj.controller,
          urlObj.action
        );
        if (permCheck) {
          methods.page = urlObj;
          renderView(methods.page.url);
        }
        if (tf.events)
          if (tf.events.pagePermission)
            methods.events.pagePermission(urlObj, permCheck);
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

    function parseNavUrl(link) {
      var urlParts = link.split("?");
      urlParts[0] = translate_url(urlParts[0]);
      if (urlParts[0] == "") urlParts[0] = settings.home;
      var path = urlParts[0].split("/");
      var controller = path[0] == "" ? settings.home : path[0];
      var action = "index";
      var arguments = [];
      var qStr = {};
      if (path.length > 1) {
        action = path[1];
        path.slice(2).forEach((element) => {
          if (element != "") arguments.push(element);
        });
      }
      if (urlParts.length > 1) {
        urlParts[1].split("&").forEach((q) => {
          var qparts = q.split("=");
          qStr[qparts[0]] = qparts[1];
        });
      }
      return new pageObject({
        controller: controller,
        action: action,
        url: controller + "/" + action + ".html",
        args: arguments,
        queryString: qStr,
        fullUrl: link,
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
          if (
            $("#__" + scope + "_scripts").find("script[src='" + srcPath + "']")
              .length == 0
          ) {
            var newSrc = $("<script></script>");
            $("#__" + scope + "_scripts").append(newSrc);
            newSrc.attr("src", srcPath);
          }
        } else {
          eval(element.innerHTML);
        }
        element.remove();
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

    function renderView(viewUrl) {
      //console.clear();
      viewUrl = settings.viewFolder + "/" + viewUrl;
      var _render = function (html) {
        var viewObj = $(html);
        var layoutInfo = viewObj.attr("app-layout");
        var layout = viewObj.attr("app-layout");
        var newTitle =
          viewObj.attr("app-title") +
          " - " +
          (settings.applicationTitle != "" ? settings.applicationTitle : "");
        if (newTitle) document.title = newTitle;
        var moveViewToLayout = function () {
          if (layout == null || layout == "") {
            $("#__app_layout").empty();
          }
          var container = $('[container="view"]');
          if (container.length == 0) container = $("#__app_layout");
          container.empty();
          container.append(viewObj);
          includeHTML("view");
          clearScripts("layout");
          loadScripts(viewObj, "view");
          setDefaultState();
          if (
            methods.page.ready != undefined &&
            typeof methods.page.ready == "function"
          ) {
            methods.page.ready();
          }
        };
        methods.page.layout = layout;
        methods.viewState = {};
        if (
          tf.events != null &&
          tf.events.beforeViewRender != null &&
          typeof tf.events.beforeViewRender == "function"
        )
          tf.events.beforeViewRender(viewUrl);
        loadLayout(layout, moveViewToLayout);
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
        url: viewUrl,
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
          var container = $("#__app_layout");
          currentLayout = null;
          container.empty();
          container.append(data);
        },
        cache: settings.allowBrowserCache,
      });
    }

    function setDefaultState() {
      var defState = methods.page.queryString.__page_state;
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
              $(e).append(html);
              includeHTML(scope);
              loadScripts(html, scope);
            },
            cache: settings.allowBrowserCache,
          });
          return;
        }
      });
    }

    var pageObject = function (obj) {
      var curState = "";
      var ret = $.extend(obj, {
        setState: function (state) {
          $("[page-state]").hide();
          $("[page-state=" + state + "]").show();
          curState = state;
          // var oldCont = $("[page-state]");
          // oldCont.addClass("fade-out");

          // oldCont[0].addEventListener("transitionend", function(e) {
          //   console.log(e);
          //   var t = $(e.target);
          //   if (e.propertyName == "opacity" && e.type == "transitionend") {
          //     t.hide();
          //   }
          // });

          // $("[page-state=" + state + "]").removeClass("fade-out");
          // $("[page-state=" + state + "]").show();
        },
        currentState: function () {
          return curState;
        },
      });
      return ret;
    };

    return methods;
  }

  if (typeof window.tf === "undefined") {
    window.tf = new thinFront();
    //window.tf.init();
  }

  window.onclick = function (e) {
    if (e.target.tagName.toLowerCase() == "a") {
      if ($(e.target).attr("href") == "#") {
        e.preventDefault();
      }
    }
  };
})(window);

// (function(window) {
//   function jwt() {
//     return ;
//   }

//   if (typeof window.token === "undefined") {
//     window.token = new jwt();
//   }
// })(window);

// bar code scan on autocomplete var
//var autocompleteToBarcode = false;
// ......

// state relation to city configuration
//var config_data = JSON.parse(tf.session.values["_menuitems"]).configurations;
//var RelationCityToState = true;

// config_data.forEach(function (obj) {
//   //console.log(obj.Key);
//   if (obj.Key == "IsStateRequiredforCity") {
//     if (obj.Value == 0) {
//       RelationCityToState = false;
//     }
//   }
// });
// ......

//var decimalConfig;
