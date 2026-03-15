/* h2l-highlight.js */

const debug = false;

const minWidth = 68;
const minHeight = 27;

const HIGHLIGHT_SIZES = ['small', 'medium', 'large', 'x-large', 'xx-large'];
const HIGHLIGHT_STYLE = ['solid', 'dashed', 'dotted'];

const HIGHLIGHT_CLASS = 'h2l-highlight';
const HIGHLIGHT_ELEMENT_NAME = 'opena11y-h2l-highlight';

const highlightSize = {
  'small' : {
    fontSize: '12pt',
    borderRadius: 5,
    borderWidth: 1,
    contrastWidth: 3,
    borderOffset: 2,
    overlayAdjust: 0
  },
  'medium' : {
    fontSize: '13pt',
    borderRadius: 5,
    borderWidth: 2,
    contrastWidth: 4,
    borderOffset: 3,
    overlayAdjust: 1
  },
  'large' : {
    fontSize: '14pt',
    borderRadius: 7,
    borderWidth: 3,
    contrastWidth: 7,
    borderOffset: 4,
    overlayAdjust: 2
  },
  'x-large' : {
    fontSize: '16pt',
    borderRadius: 7,
    borderWidth: 4,
    contrastWidth: 8,
    borderOffset: 5,
    overlayAdjust: 3
  },
  'xx-large' : {
    fontSize: '18pt',
    borderRadius: 9,
    borderWidth: 5,
    contrastWidth: 11,
    borderOffset: 5,
    overlayAdjust: 4
  }
};

const styleTemplate = document.createElement('template');
styleTemplate.innerHTML = `
<style>

.h2l-highlight,
.hidden-elem-msg {
  color-scheme: light dark;

  --info-font-family: arial, verdana, tahoma, "trebuchet MS", sans-serif;
  --role-font-family: courier, monospace;

  --color-light-text-color:   #000000;
  --color-light-border-color: hsl(21.6, 100%, 50.98%);
  --color-light-background:  #dddddd;

  --color-dark-text-color:    #ffffff;
  --color-dark-border-color:  #dddddd;
  --color-dark-background:   hsl(21.6, 100%, 49.02%);

  --color-light-hidden-text:       #000000;
  --color-light-hidden-background: #ffcc00;

  --color-dark-hidden-text:       #ffcc00;
  --color-dark-hidden-background: #000000;

  --font-size:      14pt;
  --border-radius:  7px;
  --border-width:   3px;
  --border-style:   solid;
  --contrast-width: 7px;

  --scroll-behavior:  instant;
  --z-index-highlight: auto;
}

.h2l-highlight {
  margin: 0;
  padding: 0;
  position: absolute;
  background: transparent;
  border-radius: var(--border-radius);
  border-width: var(--contrast-width);
  border-style: solid;
  border-color: light-dark(var(--color-light-background), var(--color-dark-background));
  box-sizing: border-box;
  pointer-events:none;
  z-index: auto;
  display: none;
}

.h2l-highlight.hasInfoBottom,
.h2l-highlight .overlay-border.hasInfoBottom {
  border-radius: var(--border-radius) var(--border-radius) var(--border-radius) 0;
}

.h2l-highlight.hasInfoTop,
.h2l-highlight .overlay-border.hasInfoTop {
    border-radius: 0 var(--border-radius) var(--border-radius) var(--border-radius);
}

.h2l-highlight .overlay-border {
  margin: 0;
  padding: 0;
  position: relative;
  border-radius: var(--border-radius);
  border-width: var(--border-width);
  border-style: var(--border-style);
  border-color: light-dark(var(--color-light-border-color), var(--color-dark-border-color));
  z-index: auto;
  box-sizing: border-box;
  pointer-events:none;
  background: transparent;
}

@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.hidden-elem-msg {
  position: absolute;
  margin: 0;
  padding: .25em;
  border: none;
  color: light-dark(var(--color-light-hidden-text), var(--color-dark-hidden-text));
  background-color: light-dark(var(--color-light-hidden-background), var(--color-dark-hidden-background));
  font-family: var(--info-font-family);
  font-size: var(--font-size);
  font-style: italic;
  font-weight: bold;
  text-align: center;
  animation: fadeIn 1.5s;
  z-index: auto;
  display: none;
}

.h2l-highlight .overlay-info {
  margin: 0;
  padding: 2px;
  position: relative;
  display: inline-block;
  text-align: left;
  font-size: var(--font-size);
  font-family: var(--info-font-family);
  border-width: var(--border-width);
  border-style: var(--border-style);
  border-color: light-dark(var(--color-light-background), var(--color-dark-background));
  background-color: light-dark(var(--color-light-background), var(--color-dark-background));
  color: light-dark(var(--color-light-text-color), var(--color-dark-text-color));
  z-index: auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events:none;
}

.h2l-highlight .overlay-info.hasInfoTop {
  border-radius: var(--border-radius) var(--border-radius) 0 0;
}

.h2l-highlight .overlay-info.hasInfoBottom {
  border-radius: 0 0 var(--border-radius) var(--border-radius);
}

.h2l-highlight .overlay-info span {
  margin: 0;
  padding: 0;
  display: inline;
}

.h2l-highlight .overlay-info span.elem-role,
.h2l-highlight .overlay-info span.desc-label {
  font-weight: bold;
  font-family: var(--info-font-family);
  }

.h2l-highlight .overlay-info span.name,
.h2l-highlight .overlay-info span.desc {
  padding-left: 0.25em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--info-font-family);
}

.h2l-highlight .overlay-info span.desc-label,
.h2l-highlight .overlay-info span.desc {
  font-style: italic;
  padding-left: 0.25em;
}

</style>
`;

/*
 * Helper functions
 */

function consoleRect (label, rect) {
  console.log(`${label} Left: ${rect.left} Top: ${rect.top} Width: ${rect.width} height: ${rect.height}`);
}

function isOdd(x) { return x & 1; };


/*
 *   @class HighlightElement
 *
 */

class H2LHighlightElement extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Add style element
    this.shadowRoot.appendChild(styleTemplate.content.cloneNode(true));

    // Get references

    this.overlayElem  = document.createElement('div');
    this.overlayElem.className = HIGHLIGHT_CLASS;
    this.shadowRoot.appendChild(this.overlayElem);
    this.overlayElem.style.display = 'none';

    this.borderElem = document.createElement('div');
    this.borderElem.className = 'overlay-border';
    this.overlayElem.appendChild(this.borderElem);

    this.infoElem = document.createElement('div');
    this.infoElem.className = 'overlay-info';
    this.overlayElem.appendChild(this.infoElem);

    this.elemRoleElem = document.createElement('span');
    this.elemRoleElem.className = 'elem-role';
    this.infoElem.appendChild(this.elemRoleElem);

    this.nameElem = document.createElement('span');
    this.nameElem.className = 'name';
    this.infoElem.appendChild(this.nameElem);

    this.descElem = document.createElement('span');
    this.descElem.className = 'desc';
    this.infoElem.appendChild(this.descElem);

    this.hiddenElem = document.createElement('div');
    this.hiddenElem.className = 'hidden-elem-msg';
    this.shadowRoot.appendChild(this.hiddenElem);
    this.hiddenElem.style.display = 'none';

    this.highlightSize = highlightSize[HIGHLIGHT_SIZES[2]];
    this.highlightStyle = HIGHLIGHT_STYLE[0];

    this.dataAttr = 'data-opena11y-id';

    this.elemRole = '??';
    this.name       = '';
    this.nameHasAlt = false;
    this.nameSrc    = '';
    this.showName = false;
    this.selected = false;

    this.desc    = '';
    this.descSrc = '';

    this.msgIsHidden = 'Element is hidden';

    this.zIndex = 0;

    this.lastElemRect = false;
    this.lastElemRole = this.elemRole;
    this.lastName = '';
    this.lastScrollBehavior = 'none';

  }

  static get observedAttributes() {
    return [
      "name",
      "name-has-alt",
      "name-src",
      "desc",
      "desc-src",
      "elem-role",
      "highlight",
      "highlight-config",
      "msg-hidden",
      "selected",
      "show-name",
      "z-index"
      ];
  }

  attributeChangedCallback(name, oldValue, newValue) {

    switch (name) {

      case "name":
        this.name = newValue;
        break;

      case "name-has-alt":
        this.nameHasAlt = newValue.trim().toLowerCase() === 'true';
        break;

      case "name-src":
        this.nameSrc = newValue;
        break;

      case "show-name":
        this.showName = newValue.trim().toLowerCase() === 'true';
        break;

      case "selected":
        this.selected = newValue.trim().toLowerCase() === 'true';
        break;

      case "desc":
        this.desc = newValue;
        break;

      case "desc-src":
        this.descSrc = newValue;
        break;

      case "elem-role":
        this.elemRole = newValue;
        break;

      case "msg-hidden":
        this.setHiddenMessage(newValue ? newValue : this.getHiddenMessage());
        break;

      case "z-index":
        this.zIndex = parseInt(newValue);
        break;

      case "highlight":
        const parts = newValue.split(';');

        if (parts.length >= 5) {

          const rect = {};
          rect.left   = parseInt(parts[0]);
          rect.top    = parseInt(parts[1]);
          rect.width  = parseInt(parts[2]);
          rect.height = parseInt(parts[3]);
          rect.right  = rect.left + rect.width;
          rect.bottom = rect.top + rect.height;
          const scrollto  = parts.length > 4 ? parts[4].trim() : 'none';

          this.highlight(rect, scrollto);
        }
        else {
          this.removeHighlight();
        }

        return;

      case "highlight-config":

        const values = newValue.split(';');

        let newSize  = this.highlightSize;
        let newStyle = this.highlightStyle;

        values.forEach( (v) => {
          const value = v.toLowerCase().trim();
          if (HIGHLIGHT_SIZES.includes(value)) {
            newSize = highlightSize[value];
          }
          if (HIGHLIGHT_STYLE.includes(value)) {
            newStyle = value;
          }
        });

        this.configStyle(newSize, newStyle);
        return;

      default:
        break;
    }
  }

  /**
   * @method configStyle
   *
   * @desc Updates style sheet based on border size and style
   *
   * @param {Object}  hSize   - Object with border dimension information
   * @param {String}  hStyle  - CSS border style property values (e.g. solid, dashed, dotted)
   *
   * @returns (Object) @desc
   */

  configStyle (hSize, hStyle="solid") {

    this.highlightSize = hSize;

    const elems = Array.from(this.shadowRoot.querySelectorAll('.h2l-highlight, .hidden-elem-msg'));

    elems.forEach( (elem) => {
      elem.style.setProperty('--font-size',      hSize.fontSize);
      elem.style.setProperty('--border-radius',  hSize.borderRadius  + 'px');
      elem.style.setProperty('--border-width',   hSize.borderWidth   + 'px');
      elem.style.setProperty('--contrast-width', hSize.contrastWidth + 'px');
      elem.style.setProperty('--border-style',   hStyle);
    });

  }

  /*
   *   @method highlight
   *
   *   @desc  Highlights the element on the page
   *
   *   @param {Object}  elemRect       : Rect of element to highlight
   *   @param {String}  scrollBehavior : 'instant', 'auto', 'smooth', 'none'
   *   @param {Boolean} force          : If true override isRduced
   */

  highlight(elemRect, scrollBehavior='none', force=false) {
    let scrollElement;
    const mediaQuery = window.matchMedia(`(prefers-reduced-motion: reduce)`);
    const isReduced = !mediaQuery || mediaQuery.matches;

    if (elemRect && scrollBehavior) {

      this.lastElemRect = elemRect;
      this.lastScrollBehavior = scrollBehavior;

      debug && console.log(`[ elemRect]: ${elemRect}`);
      debug && console.log(`[   scroll]: ${scrollBehavior}`);

      const elemRole = (this.nameSrc === 'contents' || this.nameSrc === 'none') &&
                       !this.nameHasAlt &&
                       !this.showName &&
                       !this.selected ?
                       this.elemRole :
                       `${this.elemRole}: `;

      const name =  this.nameSrc !== 'contents' ||
                    this.nameHasAlt ||
                    this.showName ||
                    this.selected ?
                    this.name :
                    '';

      const desc = this.desc;

      this.lastElemRole = elemRole;
      this.lastName = name;

      if (this.isElementHidden(elemRect)) {
        // If element is hidden make hidden element message visible
        // and use for highlighting
        this.hiddenElem.textContent = this.getHiddenMessage();
        this.hiddenElem.style.display = 'block';

        const minValue = this.highlightSize.contrastWidth;

        const left = elemRect.left > minValue ?
                            elemRect.left :
                            minValue;
        const top  = elemRect.top > minValue ?
                            elemRect.top :
                            minValue;

        this.hiddenElem.style.left = left + 'px';
        this.hiddenElem.style.top = top + 'px';

        scrollElement = this.updateHighlightElement(this.hiddenElem.getBoundingClientRect(),
                                                    elemRole,
                                                    name,
                                                    desc,
                                                    0,
                                                    this.highlightSize.borderWidth,
                                                    this.highlightSize.contrastWidth,
                                                    this.highlightSize.overlayAdjust);
      }
      else {
        this.hiddenElem.style.display = 'none';

        scrollElement = this.updateHighlightElement(elemRect,
                                                    elemRole,
                                                    name,
                                                    desc,
                                                    this.highlightSize.borderOffset,
                                                    this.highlightSize.borderWidth,
                                                    this.highlightSize.contrastWidth,
                                                    this.highlightSize.overlayAdjust);
      }

      if (scrollBehavior !== 'none') {
        if (this.isElementInHeightLarge(elemRect)) {
          if (!this.isElementStartInViewport(elemRect) && (!isReduced || force)) {
            scrollElement.scrollIntoView({ behavior: scrollBehavior, block: 'start', inline: 'nearest' });
          }
        }
        else {
          if (!this.isElementInViewport(elemRect)  && (!isReduced || force)) {
            scrollElement.scrollIntoView({ behavior: scrollBehavior, block: 'center', inline: 'nearest' });
          }
        }
      }
    }
  }

  /*
   *  @method  updateHighlightElement
   *
   *  @desc  Create an overlay element and set its position on the page.
   *
   *  @param  {Object}  elemRect       -  Rect of element node to highlight
   *  @param  {String}  elemRole       -  Description of the element
   *  @param  {String}  name           -  Accessible name
   *  @param  {String}  desc           -  Accessible description
   *  @param  {Number}  borderOffset   -  Number of pixels for offset
   *  @param  {Number}  borderWidth    -  Number of pixels for border width
   *  @param  {Number}  contrastWidth  -  Number of pixels to provide border contrast
   *
   */

   updateHighlightElement (elemRect, elemRole, name, desc, borderOffset, borderWidth, contrastWidth, overlayAdjust) {
    debug && console.log(`\n[     elemRole]: ${elemRole}`);
    debug && console.log(`[         name]: ${name}`);
    debug && console.log(`[  description]: ${desc}`);

    debug && console.log(`[ borderOffset]: ${borderOffset}`);
    debug && console.log(`[  borderWidth]: ${borderWidth}`);
    debug && console.log(`[contrastWidth]: ${contrastWidth}`);
    debug && console.log(`[overlayAdjust]: ${overlayAdjust}`);
    debug && consoleRect('elemRect', elemRect);

    const adjRect = this.getAdjustedRect(elemRect, borderOffset, borderWidth, contrastWidth);
    debug && consoleRect('adjRect', adjRect);

    const a = -1 * (contrastWidth);
    const b = (contrastWidth - borderWidth) / 2;

//    this.overlayElem.style.outline   = '1px dotted green';
//    this.borderElem.style.outline    = '1px dashed blue';

    this.overlayElem.style.left   = adjRect.left   + 'px';
    this.overlayElem.style.top    = adjRect.top    + 'px';
    this.overlayElem.style.zIndex = this.zIndex + 1;

    this.borderElem.style.left    = a + b + 'px';
    this.borderElem.style.top     = a + b + 'px';

    this.overlayElem.style.height = adjRect.height + 'px';
    this.overlayElem.style.width  = adjRect.width  + 'px';

    this.borderElem.style.width   = (adjRect.width - 2 * b) + 'px';
    this.borderElem.style.height  = (adjRect.height - 2 * b) + 'px';


    if (this.selected) {
      this.infoElem.classList.add('selected');
    }
    else {
      this.infoElem.classList.remove('selected');
      this.infoElem.style.maxWidth  = (adjRect.width - 2 * contrastWidth) + 'px';
    }

    this.overlayElem.style.display = 'block';
    this.borderElem.style.display  = 'block';

    if (elemRole) {

      this.infoElem.style.display    = 'inline-block';
      this.infoElem.title            = name ?
                                       `${elemRole}: ${name}${ desc ? `; ${desc}` : ``}` :
                                       '';

      this.elemRoleElem.textContent  = elemRole;
      this.nameElem.textContent      = name;
      this.descElem.textContent = desc ? `; ${desc}` : '';

      const infoElemOffsetLeft = -1 * contrastWidth;
      this.infoElem.style.left = infoElemOffsetLeft + 'px';

      const infoElemRect    = this.infoElem.getBoundingClientRect();

      // Is info displayed above or below the highlighted element
      if (adjRect.top >= infoElemRect.height) {
        // Info is displayed above the highlighted element (e.g. most of the time)
        this.overlayElem.classList.remove('hasInfoBottom');
        this.borderElem.classList.remove('hasInfoBottom');
        this.infoElem.classList.remove('hasInfoBottom');
        this.overlayElem.classList.add('hasInfoTop');
        this.borderElem.classList.add('hasInfoTop');
        this.infoElem.classList.add('hasInfoTop');
        this.infoElem.style.top =  (-1 * (adjRect.height +
                                         infoElemRect.height +
                                         overlayAdjust))  + 'px';
      }
      else {
        // Info is displayed below the highlighted element when it is at the top of
        // the window

        this.overlayElem.classList.remove('hasInfoTop');
        this.borderElem.classList.remove('hasInfoTop');
        this.infoElem.classList.remove('hasInfoTop');
        this.overlayElem.classList.add('hasInfoBottom');
        this.borderElem.classList.add('hasInfoBottom');
        this.infoElem.classList.add('hasInfoBottom');
        this.infoElem.style.top  = (-1 * borderWidth) + 'px';
      }
      return this.infoElem;
    }
    else {
      this.overlayElem.classList.remove('hasInfoTop');
      this.overlayElem.classList.remove('hasInfoBottom');
      this.borderElem.classList.remove('hasInfoTop');
      this.borderElem.classList.remove('hasInfoBottom');
      this.infoElem.style.display = 'none';
      return this.overlayElem;
    }
  }

  /*
   *   @method getAdjustedRect
   *
   *   @desc  Returns a object with dimensions adjusted for highlighting element
   *
   *  @param  {Object}  elemRect        -  Rect of element to be highlighted
   *  @param  {Number}  borderOffset    -  Number of pixels for offset
   *  @param  {Number}  borderWidth     -  Number of pixels for border width
   *  @param  {Number}  contrastWidth   -  Number of pixels to provide border contrast
   *
   *   @returns see @desc
   */
   getAdjustedRect(elemRect, borderOffset, borderWidth, contrastWidth) {

    const adjRect = {
      left: 0,
      top: 0,
      width: 0,
      height: 0
    };

    const minOffset = borderOffset + contrastWidth;

    adjRect.left    = elemRect.left > minOffset ?
                      Math.round(elemRect.left + (-1 * minOffset)) :
                      Math.round(elemRect.left);

    adjRect.width   = Math.round(Math.max(elemRect.width  + (2 * minOffset), minWidth));

    adjRect.top     = elemRect.top > minOffset ?
                      Math.round(elemRect.top  + (-1 * minOffset)) :
                      Math.round(elemRect.top);

    adjRect.height  = Math.round(Math.max(elemRect.height + (2 * minOffset), minHeight));

    // Element is near top or left side of screen
    if (adjRect.top < 0) {
      adjRect.top = minOffset;
    }
    if (adjRect.left < 0) {
      adjRect.left = minOffset;
    }

    return adjRect;
  }

  /*
   *   @method isElementInViewport
   *
   *   @desc  Returns true if element is already visible in view port,
   *          otheriwse false
   *
   *   @param {Object} rect : Rect of element to highlight
   *
   *   @returns see @desc
   */

  isElementInViewport(rect) {
    return (
      rect.top >= window.screenY &&
      rect.left >= window.screenX &&
      rect.bottom <= ((window.screenY + window.innerHeight) ||
                      (window.screenY + document.documentElement.clientHeight)) &&
      rect.right <= ((window.screenX + window.innerWidth) ||
                     (window.screenX + document.documentElement.clientWidth)));
  }

  /*
   *   @method isElementStartInViewport
   *
   *   @desc  Returns true if start of the element is already visible in view port,
   *          otherwise false
   *
   *   @param {Object} rect : Rect of element to highlight
   *
   *   @returns see @desc
   */

  isElementStartInViewport(rect) {
    return (
        rect.top >= window.screenY &&
        rect.top <= ((window.screenY + window.innerHeight) ||
                     (window.screenY + document.documentElement.clientHeight)) &&
        rect.left >= window.screenX &&
        rect.left <= ((window.screenX + window.innerWidth) ||
                     (window.screenX + document.documentElement.clientWidth)));
  }

  /*
   *   @method isElementHeightLarge
   *
   *   @desc  Returns true if element client height is larger than clientHeight,
   *          otheriwse false
   *
   *   @param {Object} rect : Bounding rect of element to highlight
   *
   *   @returns see @desc
   */

  isElementInHeightLarge(rect) {
    return (1.2 * rect.height) > (window.innerHeight || document.documentElement.clientHeight);
  }

  /*
   *   @method isElementHidden
   *
   *   @desc  Returns true if the element is hidden on the
   *          graphical rendering
   *
   *   @param  {Object}  rect   : Bounding rect of element to highlight
   *
   *   @returns see @desc
   */
  isElementHidden(rect) {
    return (rect.height < 3) ||
           (rect.width  < 3) ||
           ((rect.left + rect.width)  < (rect.width / 2)) ||
           ((rect.top  + rect.height) < (rect.height / 2));
  }

  /*
   *   @method setHiddenMessage
   *
   *   @desc  Sets a string describing the hidden element
   *
   *   @param {String}  msg : A string describing the hidden element
   *
   */
  setHiddenMessage(msg) {
    this.msgIsHidden = msg;
  }

  /*
   *   @method getHiddenMessage
   *
   *   @desc  Returns string describing the hidden element
   *
   *   @returns see @desc
   */
  getHiddenMessage(type) {
    return this.msgIsHidden;
  }

  /*
   *   @method removeHighlight
   *
   *   @desc  Hides the highlight element on the page
   */
  removeHighlight() {
    if (this.overlayElem) {
      this.overlayElem.style.display = 'none';
      this.hiddenElem.style.display = 'none';
    }
  }

}

// Create highlight element
window.customElements.define(HIGHLIGHT_ELEMENT_NAME, H2LHighlightElement);


