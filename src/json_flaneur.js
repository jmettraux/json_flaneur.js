
var JsonFlaneur = (function() {

  const VERSION = '1.0.0';

  "use strict";

  let self = this;

  //
  // protected functions

  let slic = function(kla) { return kla.match(/^\./) ? kla.slice(1) : kla; }

  let hasc = function(elt, kla) {

    return elt && elt.classList.contains(slic(kla));
  }

  let addc = function(elt, kla, add=true) {

    if ( ! isElt(elt)) return;
    if (add) elt.classList.add(slic(kla));
    else elt.classList.remove(slic(kla));
  };

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

    args = Array.from(args);

    let r = args.reduce(
      function(h, e) { h[determineType(e) + 's'].push(e); return h; },
      { strings: [], elts: [], objects: [], arrays: [], numbers: [],
        booleans: [], nulls: [], undefineds: [], functions: [] });
    r.empty = (args.length < 1);

    return r;
  }

  let elementFunctions = {};
    //
  elementFunctions.jfIsEmpty = function() {

    return this.querySelectorAll('.jflaneur-value').length === 0;
  };

  let rootFunctions = {};
    //
  rootFunctions.jfCollapse = function() {

    let args = sortArgs(arguments);

    let pe = this.parentElement;

    if (args.empty) {
      toggle(pe, true);
    }
    else if (args.functions.length > 0) {
      let f = args.functions[0];
      for (let e of pe.querySelectorAll('.jflaneur-collection')) {
        if (hasc(e, '.jflaneur-empty')) continue;
        addc(e, '.jflaneur-collapsed', f(e));
      }
    }
  };

  let computeDepth = function(elt) {

    let ce = elt.closest('.jflaneur-collection');

    return ce ? 1 + computeDepth(ce.parentElement) : -1;
  };

  elementProperties = {};
  elementProperties.jf = {
    get() {
      let t = hasc(this, '.jflaneur-array') ? 'array' : 'object';
      let ve = this.closest('.jflaneur-value');
      let ke = ve && ve.previousElementSibling;
      let k = ke && ke.__jflaneur_key;
      this.__jf = this.__jf || {
        type: t,
        key: k && (t === 'array' ? parseInt(k, 10) : k),
        depth: computeDepth(this),
        path: ke && (ke.title || computeTitle(ke)),
        length: this.childNodes[0].childNodes.length / 2 };
      return this.__jf;
    },
    enumberable: false,
  };

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

    for (let fname in elementFunctions) {
      e[fname] = elementFunctions[fname].bind(e);
    }
    for (let pname in elementProperties) {
      Object.defineProperty(e, pname, elementProperties[pname]);
    }

    return e;
  };

  let computeTitle = function(e) {

    let k = e.__jflaneur_key;

    if (hasc(e, '.jflaneur')) return '$';

    let pt = computeTitle(e.parentElement); if ( ! k) return pt;

    let ce = e.closest('.jflaneur-collection');

    return pt + (hasc(ce, '.jflaneur-array') ? `[${k}]` : `.${k}`);
  };

  let toggle = function(elt, all) {

    let k = 'jflaneur-collapsed';
    let s = '.jflaneur-collection';
    let ce = elt.querySelector(s);

    if ( ! ce) return;

    let ced = hasc(ce, k);

    for (let e of (all ? elt.querySelectorAll(s) : [ ce ])) {

      if (e.jfIsEmpty()) return;

      if (ced) { e.classList.remove(k); }
      else { e.classList.add(k); }
    }

    window.getSelection().removeAllRanges();
  };

  let keyClick = function(ev) {

    ev.stopPropagation();

    toggle(this.nextElementSibling, ev.shiftKey || ev.ctrlKey);
  };

  let valueClick = function(ev) {

    ev.stopPropagation();

    if ( ! hasc(this.childNodes[0], '.jflaneur-collapsed')) return;

    toggle(this, ev.shiftKey || ev.ctrlKey);
  };

  let collectionClick = function(ev) {

    ev.stopPropagation();

    toggle(this.parentElement, ev.shiftKey || ev.ctrlKey);
  };

  let keyEnter = function(ev) {

    ev.stopPropagation();

    this.title = this.title || computeTitle(this);

    if ( ! (
      hasc(this, '.jflaneur-array-key') ||
      hasc(this, '.jflaneur-object-key')
    )) return;

    if (this.style.cursor === 'pointer') return;

    let ve = this.nextElementSibling.childNodes[0];

    if (hasc(ve, 'jflaneur-empty')) return;
    if ( ! (hasc(ve, 'jflaneur-array') || hasc(ve, 'jflaneur-object'))) return;

    this.style.cursor = 'pointer';
  };

  let makeKeyElement = function(t, js) {

    let k = '' + js;

    let e = makeElt(`.jflaneur-key.jflaneur-${t}-key`, k)
    e.__jflaneur_key = k;

    e.addEventListener('click', keyClick.bind(e));
    e.addEventListener('mouseenter', keyEnter.bind(e));

    return e;
  };

  let makeValueElement = function(t, k, js) {

    let v = js[k];

    let e = makeElt(`.jflaneur-value.jflaneur-${t}-value`);
    e.__jflaneur_key = k;

    e.appendChild(makeElement(v));

    e.addEventListener('click', valueClick.bind(e));
    e.addEventListener('mouseenter', keyEnter.bind(e));

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
        be.appendChild(makeValueElement(t, k, js));
      }
      e.setAttribute(
        'data-size',
        t === 'array' ? `${c} item${c < 2 ? '' : 's'}` :
        `${c} entr${c < 2 ? 'y' : 'ies'}`);
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
    //e.__jflaneur_key = '$';

    for (let fname in rootFunctions) {
      e[fname] = rootFunctions[fname].bind(e);
    }

    return e;
  };
  this.make = this.makeElement;

  //
  // over.

  return this;

}).apply({}); // end JsonFlaneur

