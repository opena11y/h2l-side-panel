  /*  gen-documentation.js */

/* Requirements */

const fs = require('fs');
const path = require('path');
const nunjucks  = require('nunjucks');

/* Constants */

const version     = "1.1";
const tagLineName = "Heading, Landmark Region and Link Navigation Extension";
const projectName   = "Headings, Landmarks and Links Side Panel";

const issuesURL   = "https://github.com/opena11y/h2l-side-panel/issues";
const issuesEmail = "jongund@illinois.edu";

const outputDirectory   = './docs/';
const templateDirectory = './src-docs/templates';
const websiteURL        = 'https://opena11y.github.io/h2l-side-panel/';
const repositoryURL     = 'https://github.com/opena11y/h2l-side-panel';

// setUseCodeTags(true);

/* Helper functions */

function outputFile(fname, data) {
  fs.writeFile(path.join(outputDirectory, fname), data, err => {
      if (err) {
        console.error(err)
        return
      }
  })
}

function outputTemplate(fname, data) {
  fs.writeFile(path.join(templateDirectory, fname), data, err => {
      if (err) {
        console.error(err)
        return
      }
  })
}


const mainPages = [
  { content: 'content-home.njk',
    title: 'Browser Extension',
    link: 'Home',
    filename: 'index.html'
  },
  { content: 'content-options.njk',
    title: 'Options',
    link: 'Options',
    filename: 'options.html'
  },
  { content: 'content-export.njk',
    title: 'Export Data',
    link: 'Export Data',
    filename: 'export.html'
  },
  { content: 'content-faq.njk',
    title: 'Frequently Asked Questions',
    link: 'FAQ',
    filename: 'faq.html'
  },
  { dropdown: 'About',
    pages: [
      { content: 'content-about-history.njk',
        title: 'History',
        link: 'History',
        filename: 'about-history.html'
      },
      { content: 'content-about-privacy.njk',
        title: 'Privacy',
        link: 'Privacy',
        filename: 'about-privacy.html'
      },
      { content: 'content-about-feedback.njk',
        title: 'Feedback and Issues',
        link: 'Feedback',
        filename: 'about-feedback.html'
      }
    ]
  }
  ];

// Create content files

function createNavigation(pages) {
  console.log(`[create Navigation]`);
  let html = '\n';
  pages.forEach( item => {
    console.log(`[create Navigation]: ${item.dropdown} ${item.filename}`);
    if (item.dropdown) {
      html += `
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle"
             data-bs-toggle="dropdown"
            href="#"
            role="button"
            aria-expanded="false">${item.dropdown}</a>
          <ul class="dropdown-menu">`;

      item.pages.forEach( p => {
        console.log(`[dropdown][page]: ${p.filename}`);
        if (p.filename) {
          html += `<li><a class="dropdown-item" href="${p.filename}">${p.link}</a></li>`;
        }
        else {
          html += `<li><hr class="dropdown-divider"></li>`;
        }
      });

      html += `
          </ul>
        </li>
      `;
    }
    else {
      html += `
        <li class="nav-item">
          <a class="nav-link" href="${item.filename}">${item.link}</a>
        </li>
      `;
    }
  });
  html += '\n';

  return html;
}

const mainNav = createNavigation(mainPages);


function createPage(page, mainNav, dropdownName='', dropdownPages=false) {
  if (page.filename) {
    console.log(`  [createPage]: ${page.filename}`);

    outputFile(page.filename,
      nunjucks.render('./src-docs/templates/page.njk',{
        content: page.content,
        navigation: mainNav,
        dropdownName: dropdownName,
        dropdownPages: dropdownPages,
        websiteURL: websiteURL,
        repositoryURL: repositoryURL,
        projectName: projectName,
        tagLineName: tagLineName,
        issuesURL: issuesURL,
        issuesEmail: issuesEmail,
        version: version,
        title: page.title
      })
    );
  }
}


// createPages(supportPages);

function createPages(pages) {
  console.log(`[create pages]`);
  pages.forEach( item => {
    if (item.dropdown) {
      item.pages.forEach( p => {
        createPage(p, mainNav, item.dropdown, item.pages);
      });
    }
    else {
      createPage(item, mainNav);
    }
  });
}

createPages(mainPages);


