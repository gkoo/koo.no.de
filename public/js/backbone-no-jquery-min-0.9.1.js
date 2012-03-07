(function(){var j=this,y=j.Backbone,z=Array.prototype.slice,A=Array.prototype.splice,g;g="undefined"!==typeof exports?exports:j.Backbone={};g.VERSION="0.9.1";var f=j._;!f&&"undefined"!==typeof require&&(f=require("underscore"));var m=j.jQuery||j.Zepto||j.ender;g.setDomLibrary=function(a){m=a};g.noConflict=function(){j.Backbone=y;return this};g.emulateHTTP=!1;g.emulateJSON=!1;var i=g.Events={on:function(a,b,c){var d,e,f,g,h;if(!b)return this;a=a.split(/\s+/);for(d=this._callbacks||(this._callbacks=
{});e=a.shift();)f=(h=d[e])?h.tail:{},f.next=g={},f.context=c,f.callback=b,d[e]={tail:g,next:h?h.next:f};return this},off:function(a,b,c){var d,e,f,g,h,q;if(a){if(e=this._callbacks)for(a=a.split(/\s+/);d=a.shift();)if(f=e[d],delete e[d],b&&f)for(g=f.tail;(f=f.next)!==g;)if(h=f.callback,q=f.context,h!==b||c&&q!==c)this.on(d,h,q)}else delete this._callbacks;return this},trigger:function(a){var b,c,d,e,f,g;if(!(d=this._callbacks))return this;f=d.all;a=a.split(/\s+/);for(g=z.call(arguments,1);b=a.shift();){if(c=
d[b])for(e=c.tail;(c=c.next)!==e;)c.callback.apply(c.context||this,g);if(c=f){e=c.tail;for(b=[b].concat(g);(c=c.next)!==e;)c.callback.apply(c.context||this,b)}}return this}};i.bind=i.on;i.unbind=i.off;var p=g.Model=function(a,b){var c;a||(a={});b&&b.parse&&(a=this.parse(a));if(c=o(this,"defaults"))a=f.extend({},c,a);if(b&&b.collection)this.collection=b.collection;this.attributes={};this._escapedAttributes={};this.cid=f.uniqueId("c");this.changed={};this._silent={};this._pending={};this.set(a,{silent:!0});
this.changed={};this._silent={};this._pending={};this._previousAttributes=f.clone(this.attributes);this.initialize.apply(this,arguments)};f.extend(p.prototype,i,{changed:null,_silent:null,_pending:null,idAttribute:"id",initialize:function(){},toJSON:function(){return f.clone(this.attributes)},get:function(a){return this.attributes[a]},escape:function(a){var b;if(b=this._escapedAttributes[a])return b;b=this.attributes[a];return this._escapedAttributes[a]=f.escape(null==b?"":""+b)},has:function(a){return null!=
this.attributes[a]},set:function(a,b,c){var d,e;f.isObject(a)||null==a?(d=a,c=b):(d={},d[a]=b);c||(c={});if(!d)return this;if(d instanceof p)d=d.attributes;if(c.unset)for(e in d)d[e]=void 0;if(!this._validate(d,c))return!1;if(this.idAttribute in d)this.id=d[this.idAttribute];var b=c.changes={},g=this.attributes,k=this._escapedAttributes,h=this._previousAttributes||{};for(e in d){a=d[e];if(!f.isEqual(g[e],a)||c.unset&&f.has(g,e))delete k[e],(c.silent?this._silent:b)[e]=!0;c.unset?delete g[e]:g[e]=
a;!f.isEqual(h[e],a)||f.has(g,e)!=f.has(h,e)?(this.changed[e]=a,c.silent||(this._pending[e]=!0)):(delete this.changed[e],delete this._pending[e])}c.silent||this.change(c);return this},unset:function(a,b){(b||(b={})).unset=!0;return this.set(a,null,b)},clear:function(a){(a||(a={})).unset=!0;return this.set(f.clone(this.attributes),a)},fetch:function(a){var a=a?f.clone(a):{},b=this,c=a.success;a.success=function(d,e,f){if(!b.set(b.parse(d,f),a))return!1;c&&c(b,d)};a.error=g.wrapError(a.error,b,a);return(this.sync||
g.sync).call(this,"read",this,a)},save:function(a,b,c){var d,e;f.isObject(a)||null==a?(d=a,c=b):(d={},d[a]=b);c=c?f.clone(c):{};c.wait&&(e=f.clone(this.attributes));a=f.extend({},c,{silent:!0});if(d&&!this.set(d,c.wait?a:c))return!1;var n=this,k=c.success;c.success=function(a,b,e){b=n.parse(a,e);c.wait&&(b=f.extend(d||{},b));if(!n.set(b,c))return!1;k?k(n,a):n.trigger("sync",n,a,c)};c.error=g.wrapError(c.error,n,c);b=this.isNew()?"create":"update";b=(this.sync||g.sync).call(this,b,this,c);c.wait&&
this.set(e,a);return b},destroy:function(a){var a=a?f.clone(a):{},b=this,c=a.success,d=function(){b.trigger("destroy",b,b.collection,a)};if(this.isNew())return d();a.success=function(e){a.wait&&d();c?c(b,e):b.trigger("sync",b,e,a)};a.error=g.wrapError(a.error,b,a);var e=(this.sync||g.sync).call(this,"delete",this,a);a.wait||d();return e},url:function(){var a=o(this.collection,"url")||o(this,"urlRoot")||t();return this.isNew()?a:a+("/"==a.charAt(a.length-1)?"":"/")+encodeURIComponent(this.id)},parse:function(a){return a},
clone:function(){return new this.constructor(this.attributes)},isNew:function(){return null==this.id},change:function(a){a||(a={});var b=this._changing;this._changing=!0;for(var c in this._silent)this._pending[c]=!0;var d=f.extend({},a.changes,this._silent);this._silent={};for(c in d)this.trigger("change:"+c,this,this.attributes[c],a);if(b)return this;for(;!f.isEmpty(this._pending);){this._pending={};this.trigger("change",this,a);for(c in this.changed)!this._pending[c]&&!this._silent[c]&&delete this.changed[c];
this._previousAttributes=f.clone(this.attributes)}this._changing=!1;return this},hasChanged:function(a){return!arguments.length?!f.isEmpty(this.changed):f.has(this.changed,a)},changedAttributes:function(a){if(!a)return this.hasChanged()?f.clone(this.changed):!1;var b,c=!1,d=this._previousAttributes,e;for(e in a)if(!f.isEqual(d[e],b=a[e]))(c||(c={}))[e]=b;return c},previous:function(a){return!arguments.length||!this._previousAttributes?null:this._previousAttributes[a]},previousAttributes:function(){return f.clone(this._previousAttributes)},
isValid:function(){return!this.validate(this.attributes)},_validate:function(a,b){if(b.silent||!this.validate)return!0;var a=f.extend({},this.attributes,a),c=this.validate(a,b);if(!c)return!0;b&&b.error?b.error(this,c,b):this.trigger("error",this,c,b);return!1}});var r=g.Collection=function(a,b){b||(b={});if(b.comparator)this.comparator=b.comparator;this._reset();this.initialize.apply(this,arguments);a&&this.reset(a,{silent:!0,parse:b.parse})};f.extend(r.prototype,i,{model:p,initialize:function(){},
toJSON:function(){return this.map(function(a){return a.toJSON()})},add:function(a,b){var c,d,e,g,k,h={},i={},j=[];b||(b={});a=f.isArray(a)?a.slice():[a];for(c=0,d=a.length;c<d;c++){if(!(e=a[c]=this._prepareModel(a[c],b)))throw Error("Can't add an invalid model to a collection");g=e.cid;k=e.id;h[g]||this._byCid[g]||null!=k&&(i[k]||this._byId[k])?j.push(c):h[g]=i[k]=e}for(c=j.length;c--;)a.splice(j[c],1);for(c=0,d=a.length;c<d;c++)(e=a[c]).on("all",this._onModelEvent,this),this._byCid[e.cid]=e,null!=
e.id&&(this._byId[e.id]=e);this.length+=d;A.apply(this.models,[null!=b.at?b.at:this.models.length,0].concat(a));this.comparator&&this.sort({silent:!0});if(b.silent)return this;for(c=0,d=this.models.length;c<d;c++)if(h[(e=this.models[c]).cid])b.index=c,e.trigger("add",e,this,b);return this},remove:function(a,b){var c,d,e,g;b||(b={});a=f.isArray(a)?a.slice():[a];for(c=0,d=a.length;c<d;c++)if(g=this.getByCid(a[c])||this.get(a[c])){delete this._byId[g.id];delete this._byCid[g.cid];e=this.indexOf(g);this.models.splice(e,
1);this.length--;if(!b.silent)b.index=e,g.trigger("remove",g,this,b);this._removeReference(g)}return this},push:function(a,b){a=this._prepareModel(a,b);this.add(a,b);return a},pop:function(a){var b=this.at(this.length-1);this.remove(b,a);return b},unshift:function(a,b){a=this._prepareModel(a,b);this.add(a,f.extend({at:0},b));return a},shift:function(a){var b=this.at(0);this.remove(b,a);return b},get:function(a){return null==a?void 0:this._byId[null!=a.id?a.id:a]},getByCid:function(a){return a&&this._byCid[a.cid||
a]},at:function(a){return this.models[a]},sort:function(a){a||(a={});if(!this.comparator)throw Error("Cannot sort a set without a comparator");var b=f.bind(this.comparator,this);1==this.comparator.length?this.models=this.sortBy(b):this.models.sort(b);a.silent||this.trigger("reset",this,a);return this},pluck:function(a){return f.map(this.models,function(b){return b.get(a)})},reset:function(a,b){a||(a=[]);b||(b={});for(var c=0,d=this.models.length;c<d;c++)this._removeReference(this.models[c]);this._reset();
this.add(a,{silent:!0,parse:b.parse});b.silent||this.trigger("reset",this,b);return this},fetch:function(a){a=a?f.clone(a):{};if(void 0===a.parse)a.parse=!0;var b=this,c=a.success;a.success=function(d,e,f){b[a.add?"add":"reset"](b.parse(d,f),a);c&&c(b,d)};a.error=g.wrapError(a.error,b,a);return(this.sync||g.sync).call(this,"read",this,a)},create:function(a,b){var c=this,b=b?f.clone(b):{},a=this._prepareModel(a,b);if(!a)return!1;b.wait||c.add(a,b);var d=b.success;b.success=function(e,f){b.wait&&c.add(e,
b);d?d(e,f):e.trigger("sync",a,f,b)};a.save(null,b);return a},parse:function(a){return a},chain:function(){return f(this.models).chain()},_reset:function(){this.length=0;this.models=[];this._byId={};this._byCid={}},_prepareModel:function(a,b){b||(b={});if(a instanceof p){if(!a.collection)a.collection=this}else{var c;b.collection=this;a=new this.model(a,b);a._validate(a.attributes,b)||(a=!1)}return a},_removeReference:function(a){this==a.collection&&delete a.collection;a.off("all",this._onModelEvent,
this)},_onModelEvent:function(a,b,c,d){("add"==a||"remove"==a)&&c!=this||("destroy"==a&&this.remove(b,d),b&&a==="change:"+b.idAttribute&&(delete this._byId[b.previous(b.idAttribute)],this._byId[b.id]=b),this.trigger.apply(this,arguments))}});f.each("forEach,each,map,reduce,reduceRight,find,detect,filter,select,reject,every,all,some,any,include,contains,invoke,max,min,sortBy,sortedIndex,toArray,size,first,initial,rest,last,without,indexOf,shuffle,lastIndexOf,isEmpty,groupBy".split(","),function(a){r.prototype[a]=
function(){return f[a].apply(f,[this.models].concat(f.toArray(arguments)))}});var u=g.Router=function(a){a||(a={});if(a.routes)this.routes=a.routes;this._bindRoutes();this.initialize.apply(this,arguments)},B=/:\w+/g,C=/\*\w+/g,D=/[-[\]{}()+?.,\\^$|#\s]/g;f.extend(u.prototype,i,{initialize:function(){},route:function(a,b,c){g.history||(g.history=new l);f.isRegExp(a)||(a=this._routeToRegExp(a));c||(c=this[b]);g.history.route(a,f.bind(function(d){d=this._extractParameters(a,d);c&&c.apply(this,d);this.trigger.apply(this,
["route:"+b].concat(d));g.history.trigger("route",this,b,d)},this));return this},navigate:function(a,b){g.history.navigate(a,b)},_bindRoutes:function(){if(this.routes){var a=[],b;for(b in this.routes)a.unshift([b,this.routes[b]]);b=0;for(var c=a.length;b<c;b++)this.route(a[b][0],a[b][1],this[a[b][1]])}},_routeToRegExp:function(a){a=a.replace(D,"\\$&").replace(B,"([^/]+)").replace(C,"(.*?)");return RegExp("^"+a+"$")},_extractParameters:function(a,b){return a.exec(b).slice(1)}});var l=g.History=function(){this.handlers=
[];f.bindAll(this,"checkUrl")},s=/^[#\/]/,E=/msie [\w.]+/;l.started=!1;f.extend(l.prototype,i,{interval:50,getFragment:function(a,b){if(null==a)if(this._hasPushState||b){var a=window.location.pathname,c=window.location.search;c&&(a+=c)}else a=window.location.hash;a=decodeURIComponent(a);a.indexOf(this.options.root)||(a=a.substr(this.options.root.length));return a.replace(s,"")},start:function(a){if(l.started)throw Error("Backbone.history has already been started");l.started=!0;this.options=f.extend({},
{root:"/"},this.options,a);this._wantsHashChange=!1!==this.options.hashChange;this._wantsPushState=!!this.options.pushState;this._hasPushState=!(!this.options.pushState||!window.history||!window.history.pushState);var a=this.getFragment(),b=document.documentMode;if(b=E.exec(navigator.userAgent.toLowerCase())&&(!b||7>=b))this.iframe=m('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo("body")[0].contentWindow,this.navigate(a);if(this._hasPushState)window.addEventListener("popstate",this.checkUrl);
else if(this._wantsHashChange&&"onhashchange"in window&&!b)window.addEventListener("hashchange",this.checkUrl);else if(this._wantsHashChange)this._checkUrlInterval=setInterval(this.checkUrl,this.interval);this.fragment=a;a=window.location;b=a.pathname==this.options.root;if(this._wantsHashChange&&this._wantsPushState&&!this._hasPushState&&!b)return this.fragment=this.getFragment(null,!0),window.location.replace(this.options.root+"#"+this.fragment),!0;if(this._wantsPushState&&this._hasPushState&&b&&
a.hash)this.fragment=a.hash.replace(s,""),window.history.replaceState({},document.title,a.protocol+"//"+a.host+this.options.root+this.fragment);if(!this.options.silent)return this.loadUrl()},stop:function(){m(window).unbind("popstate",this.checkUrl).unbind("hashchange",this.checkUrl);clearInterval(this._checkUrlInterval);l.started=!1},route:function(a,b){this.handlers.unshift({route:a,callback:b})},checkUrl:function(){var a=this.getFragment();a==this.fragment&&this.iframe&&(a=this.getFragment(this.iframe.location.hash));
if(a==this.fragment||a==decodeURIComponent(this.fragment))return!1;this.iframe&&this.navigate(a);this.loadUrl()||this.loadUrl(window.location.hash)},loadUrl:function(a){var b=this.fragment=this.getFragment(a);return f.any(this.handlers,function(a){if(a.route.test(b))return a.callback(b),!0})},navigate:function(a,b){if(!l.started)return!1;if(!b||!0===b)b={trigger:b};var c=(a||"").replace(s,"");if(!(this.fragment==c||this.fragment==decodeURIComponent(c)))this._hasPushState?(0!=c.indexOf(this.options.root)&&
(c=this.options.root+c),this.fragment=c,window.history[b.replace?"replaceState":"pushState"]({},document.title,c)):this._wantsHashChange?(this.fragment=c,this._updateHash(window.location,c,b.replace),this.iframe&&c!=this.getFragment(this.iframe.location.hash)&&(b.replace||this.iframe.document.open().close(),this._updateHash(this.iframe.location,c,b.replace))):window.location.assign(this.options.root+a),b.trigger&&this.loadUrl(a)},_updateHash:function(a,b,c){c?a.replace(a.toString().replace(/(javascript:|#).*$/,
"")+"#"+b):a.hash=b}});var v=g.View=function(a){this.cid=f.uniqueId("view");this._configure(a||{});this._ensureElement();this.initialize.apply(this,arguments)},w="model,collection,el,id,attributes,className,tagName".split(",");f.extend(v.prototype,i,{tagName:"div",initialize:function(){},render:function(){return this},remove:function(){this.$el.remove();return this},make:function(a,b,c){a=document.createElement(a);b&&m(a).attr(b);c&&m(a).html(c);return a},setElement:function(a,b){this.el=a;!1!==b&&
this.delegateEvents();return this},_configure:function(a){this.options&&(a=f.extend({},this.options,a));for(var b=0,c=w.length;b<c;b++){var d=w[b];a[d]&&(this[d]=a[d])}this.options=a},_ensureElement:function(){if(this.el)this.setElement(this.el,!1);else{var a=o(this,"attributes")||{};if(this.id)a.id=this.id;if(this.className)a["class"]=this.className;this.setElement(this.make(this.tagName,a),!1)}}});p.extend=r.extend=u.extend=v.extend=function(a,b){var c=F(this,a,b);c.extend=this.extend;return c};
var G={create:"POST",update:"PUT","delete":"DELETE",read:"GET"};g.sync=function(a,b,c){var d=G[a],e={type:d,dataType:"json"};if(!c.url)e.url=o(b,"url")||t();if(!c.data&&b&&("create"==a||"update"==a))e.contentType="application/json",e.data=JSON.stringify(b.toJSON());if(g.emulateJSON)e.contentType="application/x-www-form-urlencoded",e.data=e.data?{model:e.data}:{};if(g.emulateHTTP&&("PUT"===d||"DELETE"===d)){if(g.emulateJSON)e.data._method=d;e.type="POST";e.beforeSend=function(a){a.setRequestHeader("X-HTTP-Method-Override",
d)}}if("GET"!==e.type&&!g.emulateJSON)e.processData=!1;return m.ajax(f.extend(e,c))};g.wrapError=function(a,b,c){return function(d,e){e=d===b?e:d;a?a(b,e,c):b.trigger("error",b,e,c)}};var x=function(){},F=function(a,b,c){var d;d=b&&b.hasOwnProperty("constructor")?b.constructor:function(){a.apply(this,arguments)};f.extend(d,a);x.prototype=a.prototype;d.prototype=new x;b&&f.extend(d.prototype,b);c&&f.extend(d,c);d.prototype.constructor=d;d.__super__=a.prototype;return d},o=function(a,b){return!a||!a[b]?
null:f.isFunction(a[b])?a[b]():a[b]},t=function(){throw Error('A "url" property or function must be specified');}}).call(this);
