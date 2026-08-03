
var JsonFlaneur = (function() {

  const VERSION = '1.0.0';

  "use strict";

  let self = this;

  //
  // protected functions

  let isElt = function(o) {

    return (
      (o !== null) &&
      (typeof o === 'object') &&
      (typeof o.tagName === 'string') &&
      (typeof o.getElementsByClassName === 'function'));
  };

  let determineType = function(o) {

    if (o === null) return 'null';
    if (Array.isArray(o)) return 'array';
    if (isElt(o)) return 'elt';
    return (typeof o);
  };

  let sortArgs = function(args) {

    return Array.from(args).reduce(
      function(h, e) { h[determineType(e) + 's'].push(e); return h; },
      { strings: [], elts: [], objects: [], arrays: [], numbers: [],
        booleans: [], nulls: [], undefineds: [] });
  }

  //let elementFunctions = {};

  let makeElt = function(/*tag, atts, text*/) {

    let args = sortArgs(arguments);
    let tag = args.strings.shift();
    let atts = args.objects.shift() || {};
    let txt = args.strings.shift();

    let m = tag.match(/[#.]?[^#.\s]+/g);
    let tagname = m.find(e => e.match(/^[^#.]/)) || 'div';

    let e = document.createElement(tagname);
      //
    for (let ic of m) {
      if (ic.match(/^\./)) e.classList.add(ic.slice(1));
      else if (ic.match(/^#/)) e.id = ic.slice(1);
    }
      //
    for (let k in atts) { e.setAttribute(k, atts[k]); }
    if (typeof txt === 'string') e.innerText = txt;

    //for (let fname in elementFunctions) {
    //  e[fname] = elementFunctions[fname].bind(e);
    //}

    return e;
  };

  let keyClick = function(ev) {

    ev.stopPropagation();

    let ce = this.parentElement.parentElement
    ce.classList.add('jflaneur-collapsed');

    if (ev.shiftKey || ev.ctrlKey || ev.metaKey) {
      for (let e of ce.querySelectorAll('.jflaneur-collection')) {
        e.classList.add('jflaneur-collapsed');
      }
    }
  };

  let collectionClick = function(ev) {

    ev.stopPropagation();

    if ( ! this.classList.contains('jflaneur-collapsed')) return;
    this.classList.remove('jflaneur-collapsed');

    if (ev.shiftKey || ev.ctrlKey || ev.metaKey) {
      for (let e of this.querySelectorAll('.jflaneur-collapsed')) {
        e.classList.remove('jflaneur-collapsed');
      }
    }
  };

  let makeKeyElement = function(t, js) {

    let e = makeElt(`.jflaneur-key.jflaneur-${t}-key`, '' + js);
    e.addEventListener('click', keyClick.bind(e));

    return e;
  };

  let makeValueElement = function(t, js) {

    let e = makeElt(`.jflaneur-value.jflaneur-${t}-value`);
    e.appendChild(makeElement(js));

    return e;
  };

  let makeLeafElement = function(t, js) {

    let v = JSON.stringify(js);
    if (t === 'string') v = v.slice(1, -1);

    return makeElt(`.jflaneur-leaf.jflaneur-${t}`, v);
  };

  let makeCollectionElement = function(t, js) {

    let e = makeElt(`.jflaneur-collection.jflaneur-${t}`);
    let be = makeElt('.jflaneur-collection-body');

    e.appendChild(be);

    let c = (t === 'array' ? js : Object.keys(js)).length;
    if (c > 0) {
      for (let k in js) {
        be.appendChild(makeKeyElement(t, k));
        be.appendChild(makeValueElement(t, js[k]));
      }
    }
    else {
      e.classList.add('jflaneur-empty');
      be.classList.add('jflaneur-empty');
    }

    e.addEventListener('click', collectionClick.bind(e));

    return e;
  };

  let makeElement = function(js) {

    let t = determineType(js);
    if (t === 'array' || t === 'object') return makeCollectionElement(t, js)
    if (t) return makeLeafElement(t, js);

    throw new Error(`JsonFlaneur: cannot make element out of ${typeof js}`);
  };

  //
  // public functions

  this.makeElement = function(js) {

    let e = makeElement(js);
    e.classList.add('jflaneur'); // for the variables ;-)

    return e;
  };
  this.make = this.makeElement;

  //
  // over.

  return this;

}).apply({}); // end JsonFlaneur

