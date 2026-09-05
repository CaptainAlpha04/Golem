/**
 * Test helpers — a minimal fake DOM and a stub Math.js.
 *
 * Golem renders through `document.createElementNS`, so the renderer needs a
 * DOM to talk to. Rather than pull in jsdom (a heavy dependency for a library
 * that otherwise has none), this provides just the handful of DOM methods
 * golem.js actually touches.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

class FakeElement {
  constructor(tag) {
    this.nodeName    = tag;
    this.tagName     = String(tag).toUpperCase();
    this.attrs       = {};
    this.children    = [];
    this.textContent = '';
    this.style       = { cssText: '' };
  }

  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k)    { return Object.hasOwn(this.attrs, k) ? this.attrs[k] : null; }
  removeAttribute(k) { delete this.attrs[k]; }
  appendChild(child) { this.children.push(child); return child; }

  // render() clears its target with `el.innerHTML = ''`
  set innerHTML(v) { if (v === '') this.children = []; }
  get innerHTML()  { return ''; }

  /** Depth-first collection of every descendant with the given tag name. */
  find(tag) {
    const out = [];
    const walk = (node) => {
      for (const c of node.children) {
        if (c.nodeName === tag) out.push(c);
        walk(c);
      }
    };
    walk(this);
    return out;
  }

  /** Every descendant, in document order. */
  all() {
    const out = [];
    const walk = (node) => { for (const c of node.children) { out.push(c); walk(c); } };
    walk(this);
    return out;
  }
}

/** Installs a global `document` sufficient for golem.js. Returns a host element. */
function installDom() {
  globalThis.document = {
    createElementNS: (ns, tag) => new FakeElement(tag),
    createElement:   (tag)     => new FakeElement(tag),
  };
  return new FakeElement('div');
}

/**
 * A stand-in for Math.js good enough to exercise the compiler's plumbing.
 * `compile(expr)` records the expression and returns a fixed numeric result,
 * which is all the compiler-threading tests need. Renderer tests supply plain
 * JS closures directly and never go through this.
 */
function fakeMath(evaluator = () => 1) {
  return {
    compile(expr) {
      return {
        expr,
        evaluate: (scope) => evaluator(expr, scope),
      };
    },
  };
}

module.exports = { FakeElement, installDom, fakeMath, SVG_NS };
