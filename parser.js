'use strict';

const fs = require('fs');
const jsdom = require("jsdom");

// osis ids
const osisIDs = [
  'Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom', '1Cor', '2Cor', 'Gal', 'Eph',
  'Phil', 'Col', '1Thess', '2Thess', '1Tim', '2Tim', 'Titus', 'Phlm', 'Heb',
  'Jas', '1Pet', '2Pet', '1John', '2John', '3John', 'Jude', 'Rev'
];

// name of translation
// NOTE: update mods.d/*.conf if you change these (and file names)
const refSystem = 'Luther';
const translationCode = 'FinUTv2016';
const translationTitle = 'Uusi Testamentti suomeksi 2016';



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
let bookIndex = 0;
let bookOpened = false;
let chapterIndex = 0;
let chapterOpened = false;
let verseIndex = 0;
let verseOpened = false;
let majorSectionWaiting = '';
let sectionWaiting = '';
let parallelReferenceWaiting = '';
let paragraphOpened = false;
let currentParagraph = null;


// NOTE: It is probably not semantically correct to close the section
// elements right away. The problem is that chapters can overlap both
// sections (ex. Eph 5) and major sections (ex. Matt 13). However, if
// a section starts at the beginning of a chapter, we want to show
// the section title inside the chapter. So...let's just make things
// easier by closing the elements, at least for now.
const addMajorSection = (text) => {
  xml += '<div type="majorSection">';
  xml += `<title>${text}</title>`;
  xml += '</div>';
};

const addSection = (text) => {
  xml += '<div type="section">';
  xml += `<title>${text}</title>`;
  xml += '</div>';
};

const addParallelReference = (text) => {
  // insert inside section element
  xml = xml.slice(0, -6) +
    `<title type="parallel">${text}</title>` + xml.slice(-6);
};

const openChapter = () => {
  chapterIndex++;
  chapterOpened = true;
  const chapterAbbr = `${osisIDs[bookIndex - 1]}.${chapterIndex}`;
  xml += `<chapter sID="${chapterAbbr}" osisID="${chapterAbbr}"/>`;
  if (majorSectionWaiting) {
    addMajorSection(majorSectionWaiting);
    majorSectionWaiting = '';
  }
  if (sectionWaiting) {
    addSection(sectionWaiting);
    sectionWaiting = '';
  }
  if (parallelReferenceWaiting) {
    addParallelReference(parallelReferenceWaiting);
    parallelReferenceWaiting = '';
  }
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
  verseIndex++;
  verseOpened = true;
  const verseAbbr = `${osisIDs[bookIndex - 1]}.${chapterIndex}.${verseIndex}`;
  xml += `<verse sID="${verseAbbr}" osisID="${verseAbbr}"/>`;
};

const closeVerse = () => {
  if (verseOpened) {
    verseOpened = false;
    const verseAbbr = `${osisIDs[bookIndex - 1]}.${chapterIndex}.${verseIndex}`;
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
    currentParagraph = el;
    xml += '<p>';
  }
};

const closeParagraph = () => {
  if (paragraphOpened) {
    paragraphOpened = false;
    if (xml.slice(-3) === '<p>') {
      // remove empty paragraphs
      xml = xml.slice(0, -3);
    } else {
      xml += '</p>';
    }
  }
};

const getClosestParagraph = (el) => {
  while ((el = el.parentElement) && !el.classList.contains('MsoBodyText'));
    return el;
};


// read html
fs.readFile(__dirname + '/FinUTv2016.html', (err, data) => {
  // parse html
  jsdom.env({
    html: data,
    done: (err, window) => {
      if (err) {
        console.log(err);
        return;
      }

      // get elements with text content
      const document = window.document;
      const elements = document.querySelectorAll('[lang="FI"]');
      const elementsLength = elements.length;

      for (let i = 0; i < elementsLength; i++) {
        const el = elements[i];
        const elParent = el.parentElement;
        const elParentClass = elParent.className;

        const nextParent = elParent.nextElementSibling;
        const nextParentChild = nextParent ?
          nextParent.children[0] : null;
        const nextNextParent = nextParent ?
          nextParent.nextElementSibling : null;
        const nextNextParentChild = nextNextParent ?
          nextNextParent.children[0] : null;
        const next3Parent = nextNextParent ?
          nextNextParent.nextElementSibling : null;
        const next3ParentChild = next3Parent ?
          next3Parent.children[0] : null;

        switch (elParentClass) {

          // new book
          case 'Kirjannimi':
            closeVerse();
            closeParagraph();
            closeChapter();
            closeBook();
            openBook(el.textContent);
            break;

          // chapter number
          case 'Lukunumero':
            closeVerse();
            if (currentParagraph && currentParagraph !== getClosestParagraph(el)) {
              closeParagraph();
            }
            closeChapter();
            openChapter();
            break;

          // verse number
          case 'Jaenumero':
            // open chapter if not opened
            // this happens for books with a single chapter
            if (!chapterOpened) {
              openChapter();
            }
            closeVerse();
            if (currentParagraph && currentParagraph !== getClosestParagraph(el)) {
              closeParagraph();
            }
            if ((currentParagraph !== getClosestParagraph(el)) ||
                (!currentParagraph && bookOpened)) {
              openParagraph(getClosestParagraph(el));
            }
            openVerse();
            break;

          // major section
          case 'Vliotsikko2':
            closeVerse();
            closeParagraph();
            if (!chapterOpened ||
                nextParentChild.className === 'Lukunumero' ||
                (nextParent.className === 'Vliotsikko3' &&
                nextNextParentChild.className === 'Lukunumero') ||
                (nextParent.className === 'Vliotsikko3synoptinen' &&
                nextNextParentChild.className === 'Lukunumero') ||
                (nextParent.className === 'Vliotsikko3synoptineneo' &&
                nextNextParentChild.className === 'Lukunumero') ||
                (nextParent.className === 'Vliotsikko3synoptinen' &&
                nextNextParent.className === 'Synoptinenviite' &&
                next3ParentChild.className === 'Lukunumero') ||
                (nextParent.className === 'Vliotsikko3synoptineneo' &&
                nextNextParent.className === 'Synoptinenviite' &&
                next3ParentChild.className === 'Lukunumero')) {
              majorSectionWaiting = el.textContent;
            } else {
              addMajorSection(el.textContent);
            }
            break;

          // section
          case 'Vliotsikko3':
          case 'Vliotsikko3synoptinen':
          case 'Vliotsikko3synoptineneo':
            closeVerse();
            closeParagraph();
            if (!chapterOpened ||
                nextParentChild.className === 'Lukunumero' ||
                (nextParent.className === 'Synoptinenviite' &&
                nextNextParentChild.className === 'Lukunumero')) {
              sectionWaiting = el.textContent;
            } else {
              addSection(el.textContent);
            }
            break;

          // parallel reference
          case 'Synoptinenviite':
            if (!chapterOpened || nextParentChild.className === 'Lukunumero') {
              parallelReferenceWaiting = el.textContent;
            } else {
              addParallelReference(el.textContent);
            }
            break;

          // text
          default:
            if (currentParagraph && currentParagraph !== getClosestParagraph(el)) {
              closeParagraph();
              openParagraph(getClosestParagraph(el));
            }
            if (verseOpened) {
              // remove underscores and add text
              xml += el.textContent.replace(/_/g, '');
            }
            break;
        }
      }

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
      fs.writeFile(__dirname + '/dist/FinUTv2016.xml', xml, err => {
        if (err) {
          console.log(err);
          return;
        }

        console.log('Success! Osis file created.');
      });

    }
  });
});
