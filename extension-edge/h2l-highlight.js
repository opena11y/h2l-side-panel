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
    contrastWidth: 1,
    borderOffset: 2,
    overlayAdjust: 2
  },
  'medium' : {
    fontSize: '13pt',
    borderRadius: 5,
    borderWidth: 2,
    contrastWidth: 1,
    borderOffset: 3,
    overlayAdjust: 2
  },
  'large' : {
    fontSize: '14pt',
    borderRadius: 7,
    borderWidth: 3,
    contrastWidth: 2,
    borderOffset: 4,
    overlayAdjust: 5
  },
  'x-large' : {
    fontSize: '16pt',
    borderRadius: 7,
    borderWidth: 4,
    contrastWidth: 2,
    borderOffset: 5,
    overlayAdjust: 6
  },
  'xx-large' : {
    fontSize: '18pt',
    borderRadius: 9,
    borderWidth: 5,
    contrastWidth: 3,
    borderOffset: 5,
    overlayAdjust: 7
  }
};

const fontFamily = 'arial, verdana, tahoma, "trebuchet MS", sans-serif';

const colorLightTextColor    = '#000000';
const colorLightBorderColor  = '#13294b';
const colorLightBackground   = '#dddddd';

const colorDarkTextColor     = '#ffffff';
const colorDarkBorderColor   = '#dddddd';
const colorDarkBackground    = '#13294b';

const colorLightHiddenText        = '#000000';
const colorLightHiddenBackground  = '#ffcc00';

const colorDarkHiddenText       = '#ffcc00';
const colorDarkHiddenBackground = '#000000';

const zIndexHighlight = '1999900';
const scrollBehavior = 'instant';

const styleHighlightTemplate = document.createElement('template');
styleHighlightTemplate.textContent = `
:root {
  color-scheme: light dark;
}

.${HIGHLIGHT_CLASS} {
  margin: 0;
  padding: 0;
  position: absolute;
  background: transparent;
  border-radius: $borderRadiuspx;
  border-width: $contrastWidthpx;
  border-style: solid;
  border-color: light-dark(${colorLightBackground}, ${colorDarkBackground});
  box-sizing: border-box;
  pointer-events:none;
  z-index: ${zIndexHighlight};
  display: none;
}

.${HIGHLIGHT_CLASS}.hasInfoBottom,
.${HIGHLIGHT_CLASS} .overlay-border.hasInfoBottom {
  border-radius: $borderRadiuspx $borderRadiuspx $borderRadiuspx 0;
}

.${HIGHLIGHT_CLASS}.hasInfoTop,
.${HIGHLIGHT_CLASS} .overlay-border.hasInfoTop {
    border-radius: 0 $borderRadiuspx $borderRadiuspx $borderRadiuspx;
}

.${HIGHLIGHT_CLASS} .overlay-border {
  margin: 0;
  padding: 0;
  position: relative;
  border-radius: $borderRadiuspx;
  border-width: $borderWidthpx;
  border-style: $borderStyle;
  border-color: light-dark(${colorLightBorderColor}, ${colorDarkBorderColor});
  z-index: ${zIndexHighlight};
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
  color: light-dark(${colorLightHiddenText}, ${colorDarkHiddenText});
  background-color: light-dark(${colorLightHiddenBackground}, ${colorDarkHiddenBackground});
  font-family: ${fontFamily};
  font-size: $fontSize;
  font-style: italic;
  font-weight: bold;
  text-align: center;
  animation: fadeIn 1.5s;
  z-index: ${zIndexHighlight};
  display: none;
}

.${HIGHLIGHT_CLASS} .overlay-info {
  margin: 0;
  padding: 2px;
  position: relative;
  text-align: left;
  font-size: $fontSize;
  font-family: ${fontFamily};
  border-width: $borderWidthpx;
  border-style: $borderStyle;
  border-color: light-dark(${colorLightBackground}, ${colorDarkBackground});
  background-color: light-dark(${colorLightBackground}, ${colorDarkBackground});
  color: light-dark(${colorLightTextColor}, ${colorDarkTextColor});
  z-index: ${zIndexHighlight};
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events:none;
}

.${HIGHLIGHT_CLASS} .overlay-info.hasInfoTop {
  border-radius: $borderRadiuspx $borderRadiuspx 0 0;
}

.${HIGHLIGHT_CLASS} .overlay-info.hasInfoBottom {
  border-radius: 0 0 $borderRadiuspx $borderRadiuspx;
}

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

    this.hiddenElem = document.createElement('div');
    this.hiddenElem.className = 'hidden-elem-msg';
    this.shadowRoot.appendChild(this.hiddenElem);
    this.hiddenElem.style.display = 'none';

    this.highlightSize = highlightSize['medium'];
    this.highlightStyle = 'solid';

    this.dataAttr = 'data-opena11y-id';

    this.msgHeadingIsHidden = 'Heading is hidden';
    this.msgRegionIsHidden = 'Region is hidden';
    this.msgElementIsHidden = 'Element is hidden';

    this.lastElem = false;
    this.lastinfo = '';

    this.configStyle(highlightSize['medium']);


  }

  static get observedAttributes() {
    return [
      "highlight",
      "highlight-config"
      ];
  }


  attributeChangedCallback(name, oldValue, newValue) {

    switch (name) {

      case "highlight":
        const parts = newValue.split(';');

        if (parts.length >= 5) {

          const type = parseInt(parts[0]);

          const rect = {};
          rect.left   = parseInt(parts[1]);
          rect.top    = parseInt(parts[2]);
          rect.width  = parseInt(parts[3]);
          rect.height = parseInt(parts[4]);
          rect.right  = rect.left + rect.width;
          rect.bottom = rect.top + rect.height;

          const info  = parts.length === 6 ? parts[5].trim() : '';

          this.highlight(type, rect, info);
        }
        else {
          this.removeHighlight();
        }

        return;

      case "highlight-config":
        console.log(`[highlight-config]: ${newValue}`);

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
   * @param {Object}  bSize   - Object with border dimension information
   * @param {String}  bStyle  - CSS border style property values (e.g. solid, dashed, dotted)
   *
   * @returns (Object) @desc
   */

  configStyle (hSize, hStyle) {

    if (!hSize || !hSize.fontSize) {
      hSize = this.highlightSize;
    }

    if (!hStyle) {
      hStyle = this.highlightStyle;
    }

    // Copy style template
    let styleContent = styleHighlightTemplate.textContent.slice(0);

    const contrastWidth = hSize.borderWidth + 2 * hSize.contrastWidth;

    styleContent = styleContent.replaceAll('$fontSize',      hSize.fontSize);
    styleContent = styleContent.replaceAll('$borderRadius',  hSize.borderRadius);
    styleContent = styleContent.replaceAll('$borderWidth',   hSize.borderWidth);
    styleContent = styleContent.replaceAll('$contrastWidth', contrastWidth);

    styleContent = styleContent.replaceAll('$borderStyle', hStyle);

    this.highlightSize  = hSize;
    this.highlightStyle = hStyle;

    let styleNode = this.shadowRoot.querySelector('style');

    if (styleNode) {
      styleNode.remove();
    }

    styleNode = document.createElement('style');
    styleNode.textContent = styleContent;
    this.shadowRoot.appendChild(styleNode);

    if (this.lastElem) {
      this.highlight(this.lastElem, this.lastinfo);
    }

  }


  /*
   *   @method highlight
   *
   *   @desc  Highlights the element on the page
   *
   *   @param {String}  type           : Type of element: 'heading' | 'landmark' | 'link'
   *   @param {Object}  elemRect       : Rect of element to highlight
   *   @param {String}  info           : Information about target
   *   @param {String}  scrollBehavior : 'instant', 'auto', 'smooth'
   *   @param {Boolean} force          : If true override isRduced
   */

  highlight(type, elemRect, info='', scrollBehavior='instant', force=false) {
    let scrollElement;
    const mediaQuery = window.matchMedia(`(prefers-reduced-motion: reduce)`);
    const isReduced = !mediaQuery || mediaQuery.matches;

    if (elemRect && scrollBehavior) {

      this.lastElemRect = elemRect;
      this.lastinfo = info;

      if (this.isElementHidden(elemRect)) {
        // If element is hidden make hidden element message visible
        // and use for highlighing
        this.hiddenElem.textContent = this.getHiddenMessage(type);
        this.hiddenElem.style.display = 'block';

        const minValue = this.highlightSize.borderOffset + 2 * this.highlightSize.contrastWidth;

        const left = elemRect.left > minValue ?
                            elemRect.left + window.scrollX :
                            minValue;
        const top  = elemRect.top > minValue ?
                            elemRect.top + window.scrollY :
                            minValue;

        this.hiddenElem.style.left = left + 'px';
        this.hiddenElem.style.top = top + 'px';
        scrollElement = this.updateHighlightElement(this.hiddenElem.getBoundingClientRect(),
                                                    info,
                                                    0,
                                                    this.highlightSize.borderWidth,
                                                    this.highlightSize.contrastWidth,
                                                    this.highlightSize.overlayAdjust);
      }
      else {
        this.hiddenElem.style.display = 'none';
        scrollElement = this.updateHighlightElement(elemRect,
                                                    info,
                                                    this.highlightSize.borderOffset,
                                                    this.highlightSize.borderWidth,
                                                    this.highlightSize.contrastWidth,
                                                    this.highlightSize.overlayAdjust);
      }

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

  /*
   *  @method  updateHighlightElement
   *
   *  @desc  Create an overlay element and set its position on the page.
   *
   *  @param  {Object}  elemRect       -  Rect of element node to highlight
   *  @param  {String}  info           -  Description of the element
   *  @param  {Number}  borderOffset   -  Number of pixels for offset
   *  @param  {Number}  borderWidth    -  Number of pixels for border width
   *  @param  {Number}  contrastWidth  -  Number of pixels to provide border contrast
   *
   */

   updateHighlightElement (elemRect, info, borderOffset, borderWidth, contrastWidth, overlayAdjust) {

    const adjRect = this.getAdjustedRect(elemRect, borderOffset, borderWidth, contrastWidth);

    const a = -1 * overlayAdjust;
    const b = 2 * contrastWidth;

//    elem.style.outline               = '1px dotted red';
//    this.overlayElem.style.outline   = '1px dotted green';
//    this.borderElem.style.outline    = '1px dashed blue';

    this.overlayElem.style.left   = adjRect.left   + 'px';
    this.overlayElem.style.top    = adjRect.top    + 'px';
    this.borderElem.style.left    = a + 'px';
    this.borderElem.style.top     = a + 'px';


    this.overlayElem.style.width  = adjRect.width  + 'px';
    this.overlayElem.style.height = adjRect.height + 'px';
    this.borderElem.style.width   = (adjRect.width - b) + 'px';
    this.borderElem.style.height  = (adjRect.height - b) + 'px';

    this.overlayElem.style.display = 'block';
    this.borderElem.style.display = 'block';

    if (info) {

      this.infoElem.style.display = 'inline-block';
      this.infoElem.textContent   = info;

      const infoElemOffsetLeft = -1 * (borderWidth + 2 * contrastWidth);
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
                                         borderWidth))  + 'px';
      }
      else {
        // Info is displayed below the highlighted element when it is at the top of
        // the window

        const infoElemOffsetTop  = -1 * (borderWidth + contrastWidth);

        this.overlayElem.classList.remove('hasInfoTop');
        this.borderElem.classList.remove('hasInfoTop');
        this.infoElem.classList.remove('hasInfoTop');
        this.overlayElem.classList.add('hasInfoBottom');
        this.borderElem.classList.add('hasInfoBottom');
        this.infoElem.classList.add('hasInfoBottom');
        this.infoElem.style.top  = infoElemOffsetTop + 'px';
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

    const minOffset = borderOffset + 2 * contrastWidth + borderWidth;

    adjRect.left    = elemRect.left > minOffset ?
                      Math.round(elemRect.left + (-1 * minOffset) + window.scrollX) :
                      Math.round(elemRect.left + window.scrollX);

    adjRect.width   = Math.round(Math.max(elemRect.width  + (2 * minOffset), minWidth));

    adjRect.top     = elemRect.top > minOffset ?
                      Math.round(elemRect.top  + (-1 * minOffset) + window.scrollY) :
                      Math.round(elemRect.top + window.scrollY);

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
   *   @method getHiddenMessage
   *
   *   @desc  Returns string describing the hidden element
   *
   *   @param  {String}  type   : 'heading' | 'landmark' | 'link'
   *
   *   @returns see @desc
   */
  getHiddenMessage(type) {

    switch (type) {
      case 'heading':
        return this.msgHeadingIsHidden;

      case 'landmark':
      return this.msgRegionIsHidden;

      default:
        break;
    }

    return this.msgElementIsHidden;
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
document.body.appendChild(document.createElement(HIGHLIGHT_ELEMENT_NAME));


