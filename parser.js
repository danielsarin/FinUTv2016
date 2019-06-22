const fs = require('fs');
const jsdom = require('jsdom');

// osis ids
const osisIDs = [
  'Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom', '1Cor', '2Cor', 'Gal', 'Eph',
  'Phil', 'Col', '1Thess', '2Thess', '1Tim', '2Tim', 'Titus', 'Phlm', 'Heb',
  'Jas', '1Pet', '2Pet', '1John', '2John', '3John', 'Jude', 'Rev'
];

// name of translation
// NOTE: update mods.d/*.conf if you change these (and file names)
const refSystem = 'Luther';
const translationCode = 'FinUTv2019';
const translationTitle = 'Uusi Testamentti suomeksi 2019';



// CREATE OSIS XML
let xml = '';

// add declaration
xml += '<?xml version="1.0" encoding="UTF-8"?>';

// open osis
xml += '<osis';
xml += ' xmlns="http://www.bibletechnologies.net/2003/OSIS/namespace"';
xml += ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"';
xml += ' xsi:schemaLocation="http://www.bibletechnologies.net/2003/OSIS/namespace http://www.bibletechnologies.net/osisCore.2.1.1.xsd"';
xml += '>';

// open osisText
xml += '<osisText';
xml += ` osisIDWork="${translationCode}"`;
xml += ' osisRefWork="bible"';
xml += ' xml:lang="fi"';
xml += ' canonical="true"';
xml += '>';

// add header
xml += '<header>';
xml += `<work osisWork="${translationCode}">`;
xml += `<title>${translationTitle}</title>`;
xml += `<refSystem>Bible.${refSystem}</refSystem>`;
xml += '</work>';
xml += '</header>';

// open bookGroup
xml += '<div type="bookGroup">';
xml += '<title>Uusi Testamentti</title>';



// define variables for parsing
let bookWaiting = false;
let majorSectionWaiting = false;
let sectionWaiting = false;
let parallelReferenceWaiting = false;
let chapterWaiting = false;
let paragraphWaiting = false;
let boldWaiting = false;
let verseWaiting = false;

let bookIndex = 0;
let chapterIndex = 0;
let verseIndex = 0;

let bookOpened = false;
let chapterOpened = false;
let paragraphOpened = false;
let verseOpened = false;

let pendingSections = '';

let john752SpecialCase = false;


// NOTE: It is probably not semantically correct to close the section
// elements right away. The problem is that chapters can overlap both
// sections (ex. Eph 5) and major sections (ex. Matt 13). However, if
// a section starts at the beginning of a chapter, we want to show
// the section title inside the chapter. So...let's just make things
// easier by closing the elements, at least for now.
const addMajorSection = (text) => {
  pendingSections += '<div type="majorSection">';
  pendingSections += `<title>${text}</title>`;
  pendingSections += '</div>';
};

const addSection = (text) => {
  pendingSections += '<div type="section">';
  pendingSections += `<title>${text}</title>`;
  pendingSections += '</div>';
};

const addParallelReference = (text) => {
  // insert inside section element
  pendingSections = pendingSections.slice(0, -6) +
    `<title type="parallel">${text}</title>` + pendingSections.slice(-6);
};

const addBold = (text) => {
  if (bookOpened) {
    if (pendingSections) {
      xml += pendingSections;
      pendingSections = '';
    }

    xml += `<b>${text}</b>`;
  }
}

const addText = (text) => {
  if (pendingSections) {
    xml += pendingSections;
    pendingSections = '';
  }

  xml += text;
}

const openChapter = () => {
  chapterIndex++;
  chapterOpened = true;
  const chapterAbbr = `${osisIDs[bookIndex - 1]}.${chapterIndex}`;
  xml += `<chapter sID="${chapterAbbr}" osisID="${chapterAbbr}"/>`;
};

const closeChapter = () => {
  if (chapterOpened) {
    verseIndex = 0;
    chapterOpened = false;
    const chapterAbbr = `${osisIDs[bookIndex - 1]}.${chapterIndex}`;
    xml += `<chapter eID="${chapterAbbr}"/>`;
  }
};

const openVerse = () => {
  if (pendingSections) {
    xml += pendingSections;
    pendingSections = '';
  }

  if (!john752SpecialCase) verseIndex++;
  verseOpened = true;
  let verseAbbr = `${osisIDs[bookIndex - 1]}.${chapterIndex}.${verseIndex}`;
  if (john752SpecialCase) verseAbbr = 'John.7.53';
  xml += `<verse sID="${verseAbbr}" osisID="${verseAbbr}"/>`;
};

const closeVerse = () => {
  if (verseOpened) {
    verseOpened = false;
    let verseAbbr = `${osisIDs[bookIndex - 1]}.${chapterIndex}.${verseIndex}`;
    if (john752SpecialCase) {
      john752SpecialCase = false;
      verseAbbr = 'John.7.53';
    }
    xml += `<verse eID="${verseAbbr}"/>`;
  }
};

const openBook = (text) => {
  bookIndex++;
  bookOpened = true;
  xml += `<div type="book" osisID="${osisIDs[bookIndex - 1]}" canonical="true">`;
  xml += `<title type="main">${text}</title>`;
};

const closeBook = () => {
  if (bookOpened) {
    chapterIndex = 0;
    xml += '</div>';
  }
};

const openParagraph = (el) => {
  if (!paragraphOpened) {
    paragraphOpened = true;
    xml += '<p>';
  }
};

const closeParagraph = () => {
  if (paragraphOpened) {
    paragraphOpened = false;
    xml += '</p>';
  }
};


const parseNode = (node) => {
  if (node.nodeType === 3) {
    const text = node.textContent.trim().replace('\n', ' ');
    if (text) {
      if (bookWaiting) {
        bookWaiting = false;
        closeVerse();
        closeParagraph();
        closeChapter();
        closeBook();
        openBook(text);
      } else if (majorSectionWaiting) {
        majorSectionWaiting = false;
        closeParagraph();
        addMajorSection(text);
      } else if (sectionWaiting) {
        sectionWaiting = false;
        closeParagraph();
        addSection(text);
      } else if (parallelReferenceWaiting) {
        parallelReferenceWaiting = false;
        addParallelReference(text);
      } else if (chapterWaiting) {
        chapterWaiting = false;
        boldWaiting = false;
        closeVerse();
        closeChapter();
        openChapter(text);
      } else if (verseWaiting) {
        verseWaiting = false;
        // open chapter if not opened, this happens for books with a single chapter
        if (!chapterOpened) openChapter();
        closeVerse();
        openVerse();
      } else if (boldWaiting) {
        boldWaiting = false;
        if (verseOpened) {
          if (paragraphWaiting) {
            paragraphWaiting = false;
            openParagraph();
          }
          addBold(text);
        }
      } else if (bookOpened) {
        if (paragraphWaiting) {
          paragraphWaiting = false;
          openParagraph();
        }
        addText(text);
      }
    }
  } else if (node.nodeType === 1) {
    const isParagraph = node.tagName === 'P';
    const isBold = node.tagName === 'B';
    const color = node.getAttribute('color');
    const size = node.getAttribute('size');
    const style = node.getAttribute('style');
    const hasBoldChild = node.childNodes[0] && node.childNodes[0].tagName === 'B';

    if (size === '2' && style === 'font-size: 11pt') {
      bookWaiting = true;
    } else if (size === '2' && style === 'font-size: 9pt' && !hasBoldChild) {
      majorSectionWaiting = true
    } else if (size === '2' && style === 'font-size: 9pt' && hasBoldChild) {
      sectionWaiting = true;
    } else if (size === '1' && style === 'font-size: 8pt') {
      parallelReferenceWaiting = true;
    } else if (size === '4' && style === 'font-size: 14pt') {
      chapterWaiting = true;
    } else if (isBold) {
      boldWaiting = true;
    } else if (isParagraph) {
      closeParagraph();
      paragraphWaiting = true;
    } else if (size === '1' && style === 'font-size: 5pt') {
      verseWaiting = true;
      if (bookIndex === 4 && chapterIndex === 8 && verseIndex === 0) {
        john752SpecialCase = true;
      }
    }

    if (node.childNodes && node.childNodes.length) {
      for (let i = 0; i < node.childNodes.length; i++) {
        parseNode(node.childNodes[i]);
      }
    }
  }
};


// read html
console.log('Parsing html file...');
try {
  fs.readFile(__dirname + '/dist/bible.html', (err, data) => {
    // parse html
    const { JSDOM } = jsdom;
    const { document } = new JSDOM(data).window;
  
    // get elements with text content
    const elements = document.querySelectorAll('*');
    const elementsLength = elements.length;

    parseNode(document.body);
  
    closeVerse();
    closeParagraph();
    closeChapter();
    closeBook();
  
  
  
    // close bookGroup
    xml += '</div>';
  
    // close osisText
    xml += '</osisText>';
  
    // close osis
    xml += '</osis>';
  
    // write file
    fs.writeFile(__dirname + '/dist/bible.xml', xml, err => {
      if (err) {
        console.log(err);
        return;
      }
  
      console.log('Success! Osis xml file created.');
    });
  });
} catch (err) {
  console.log(err);
  return;
}

