/* h2l-dialog-templates.js */

/* Options */

export const highlightTemplate = document.createElement('template');
highlightTemplate.innerHTML = `
        <fieldset>
          <legend data-i18n="options_dialog_legend_highlight">
            Highlight/Focus
          </legend>

            <label class="grid">
                <input type="checkbox"
                       data-option="highlightFollowsFocus"/>
              <span class="label"
                    data-i18n="options_dialog_label_highlight">
              </span>
            </label>

            <div class="select">
              <label for="id-highlight-size"
                     data-i18n="options_dialog_label_highlight_size">
              </label>
              <select id="id-highlight-size"
                       data-option="highlightSize">
                <option value="small"
                        data-i18n="options_dialog_highlight_size_small">
                </option>
                <option value="medium"
                        data-i18n="options_dialog_highlight_size_medium">
                </option>
                <option value="large"
                        data-i18n="options_dialog_highlight_size_large">
                </option>
                <option value="x-large"
                        data-i18n="options_dialog_highlight_size_x_large">
                </option>
                <option value="xx-large"
                        data-i18n="options_dialog_highlight_size_xx_large">
                </option>
              </select>
            </div>

            <div class="select">
              <label for="id-highlight-style"
                     data-i18n="options_dialog_label_highlight_style">
              </label>
              <select id="id-highlight-style"
                       data-option="highlightStyleSelected">
                <option value="solid"
                        data-i18n="options_dialog_highlight_style_solid">
                </option>
                <option value="dashed"
                        data-i18n="options_dialog_highlight_style_dashed">
                </option>
                <option value="dotted"
                        data-i18n="options_dialog_highlight_style_dotted">
                </option>
              </select>
            </div>
        </fieldset>
`;

export const exportTemplate = document.createElement('template');
exportTemplate.innerHTML = `
    <fieldset>
      <legend data-i18n="export_dialog_legend_info">
        ABC
      </legend>

        <label class="grid">
            <input type="checkbox"
                   data-group="info"
                   data-option="exportHeadings"/>
          <span class="label"
                data-i18n="export_dialog_label_headings">
          </span>
        </label>

        <label class="grid">
            <input type="checkbox"
                   data-group="info"
                   data-option="exportLandmarks"/>
          <span class="label"
                data-i18n="export_dialog_label_landmarks">
          </span>
        </label>
        <label class="grid">
            <input type="checkbox"
                   data-group="info"
                   data-option="exportLinks"/>
          <span class="label"
                data-i18n="export_dialog_label_links">
          </span>
        </label>

    </fieldset>

    <fieldset>
      <legend data-i18n="export_dialog_legend_filename">
        ABC
      </legend>

      <div class="text">
        <label for="id-filename"
               data-i18n="export_dialog_label_filename">
        </label>
        <input  id="id-filename"
                type="text"
                size="32"
                maxlength="32"
                data-option="exportFilename"
                aria-describedby="id-filename-desc"/>
        <div id="id-filename-desc"
             class="desc"
             data-i18n="export_dialog_desc_filename">
        </div>
      </div>

      <div class="text">
          <label for="id-index"
                data-i18n="export_dialog_label_index">
          </label>
          <input id="id-index"
                 type="number"
                 min="1"
                 size="6"
                 pattern="\d*"
                 data-option="exportIndex"
                aria-describedby="id-index-desc"/>
        <div id="id-index-desc"
             class="desc"
             data-i18n="export_dialog_desc_index">
        </div>
      </div>

    </fieldset>

    <label class="grid">
        <input type="checkbox"
               data-group="info"
               data-option="promptForExportOptions"/>
      <span class="label"
            data-i18n="export_prompt_for_export_options">
      </span>
    </label>
`;

export const linkFilterTemplate = document.createElement('template');
linkFilterTemplate.innerHTML = `

    <div slot="options">
      <fieldset >
        <legend data-i18n="options_dialog_legend_link">
          ABC
        </legend>

          <label class="grid">
            <input type="checkbox"
                   data-group="links"
                   data-option="internalLinks"
                   aria-describedby="id-link-desc"/>
            <span class="label"
                  data-i18n="options_dialog_label_internal_links">
            </span>
          </label>

          <label class="grid">
            <input type="checkbox"
                   data-group="links"
                   data-option="sameSubDomainLinks"
                   aria-describedby="id-link-desc"/>
            <span class="label"
                  data-i18n="options_dialog_label_same_sub_domain">
            </span>
          </label>

          <label class="grid">
            <input type="checkbox"
                   data-group="links"
                   data-option="sameDomainLinks"
                   aria-describedby="id-link-desc"/>
            <span class="label"
                  data-i18n="options_dialog_label_same_domain">
            </span>
          </label>

          <label class="grid">
            <input type="checkbox"
                   data-group="links"
                   data-option="externalLinks"
                   aria-describedby="id-link-desc"/>
            <span class="label"
                  data-i18n="options_dialog_label_external_links">
            </span>
          </label>

          <label class="grid">
            <input type="checkbox"
                   data-group="links"
                   data-option="nonHtmlExtensionLinks"
                   aria-describedby="id-link-desc"/>
            <span class="label"
                  data-i18n="options_dialog_label_non_html_links">
            </span>
          </label>


          <div class="grid">
            <div></div>
            <div id="id-link-desc"
               class="desc"
               data-i18n="options_dialog_links_desc">
            </div>
          </div>
      </fieldset>
    </div>
`

export const aboutTemplate = document.createElement('template');
aboutTemplate.innerHTML = `
    <div class="about-icon">
      <img src="icons/h2l-64-light.png" alt="headings, landmarks and links logo">
    </div>
    <div class="version"><span data-i18n="about_version"></span> <span id="version"></span></div>
    <p>
      The <em>Headings, Landmarks and Links Side Panel</em> (H2L) provides a
       view of the headings, landmark regions and links on a web page.
    <p>
    <table class="info">
      <thead>
        <tr>
          <th>Elements</th>
          <th>Features</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Headings (<code>h1-h6</code>)</td>
          <td>
            <ul class="info">
              <li>Proper use of headings.</li>
              <li>Highlighting headings.</li>
              <li>Export to CSV.</li>
              <li>Identify hidden headings.</li>
            </ul>
          </td>
        </tr>
        <tr>
          <td>Landmark Regions</td>
          <td>
            <ul class="info">
              <li>Proper use of landmarks.</li>
              <li>Highlighting landmarks.</li>
              <li>Export to CSV.</li>
              <li>Identify hidden landmarks.</li>
            </ul>
          </td>
        </tr>
        <tr>
          <td>Links</td>
          <td>
            <ul class="info">
              <li>Verify link name describes the target of link.</li>
              <li>Highlighting links.</li>
              <li>Filtering links based on URL properties.</li>
              <li>Identify links with accessible descriptions.</li>
              <li>Identify links to non-html documents.</li>
              <li>Identify links with no name.</li>
              <li>Export to CSV.</li>
              <li>Identify hidden links.</li>
            </ul>
          </td>
        </tr>
      </tbody>
    </table>
`;

/* Buttons */

export const buttonsDefaultsCloseTemplate = document.createElement('template');
buttonsDefaultsCloseTemplate.innerHTML = `
  <div class="row">
    <button  class="first"
             id="id-reset-defaults"
            data-i18n="dialog_reset_defaults">
      Reset Defaults
    </button>
    <button class="third"
            id="id-close-2"
             data-i18n="options_dialog_close">
      Close
    </button>
  </div>
`;

export const buttonsDefaultsCloseExportTemplate = document.createElement('template');
buttonsDefaultsCloseExportTemplate.innerHTML = `
  <div class="row">
    <button  class="first"
             id="id-reset-defaults"
             data-i18n="dialog_reset_defaults">
      Def
    </button>
    <button  class="second"
             id="id-close-2"
             data-i18n="export_dialog_cancel">
      Can
    </button>
    <button  class="third"
             id="id-export"
             data-i18n="export_dialog_export">
      Ex
    </button>
  </div>
</dialog>
`;

export const buttonsInfoCloseTemplate = document.createElement('template');
buttonsInfoCloseTemplate.innerHTML = `
  <div class="center">
    <button id="id-more-info"
            data-i18n="dialog_about_more_information">
    </button>
  </div>
  <div class="center">
    <button id="id-close-2"
            data-i18n="options_dialog_close">
    </button>
  </div>
</dialog>
`;
