let popupTag = '<div id="searchResults" class="search-results-div search-results-card"></div>'

let pointerDivTag = '<div id="searchIcon" class="pointer-div">' +
    '<i class="fa fa-lg fa-search fa-search-change" aria-hidden="true"></i></div>'

$('body').append(popupTag);
$('body').append(pointerDivTag);


let searchIconDivId = 'searchIcon';
let searchResultsPopupId = 'searchResults';
let DICT_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
let dictSearchLimit = 20;
let textBoundRects;
let tabNames = [
    ['Dictionary', 'dictionary'],
    ['Web Search', 'webSearch'],
    ['Suggestion', 'suggestion'],
];
let activeTabId = "";
let searchIconHovered = false;
let hello = [
    {
        "word": "hello",
        "phonetic": "/həˈlō/",
        "origin": "Early 19th century variant of earlier hollo; related to holla.",
        "meanings": [
            {
                "partOfSpeech": "exclamation",
                "definitions": [
                    {
                        "definition": "Used as a greeting or to begin a telephone conversation.",
                        "example": "hello there, Katie!"
                    }
                ]
            },
            {
                "partOfSpeech": "noun",
                "definitions": [
                    {
                        "definition": "An utterance of “hello”; a greeting.",
                        "example": "she was getting polite nods and hellos from people",
                        "synonyms": [
                            "greeting",
                            "welcome",
                            "salutation",
                            "saluting",
                            "hailing",
                            "address",
                            "hello",
                            "hallo"
                        ]
                    }
                ]
            },
            {
                "partOfSpeech": "intransitive verb",
                "definitions": [
                    {
                        "definition": "Say or shout “hello”; greet someone.",
                        "example": "I pressed the phone button and helloed"
                    }
                ]
            }
        ]
    }
];


$(document).on({
    'selectionchange': function () {
        textBoundRects = window.getSelection().getRangeAt(0).getBoundingClientRect();
        let selector = $('#' + searchIconDivId);
        selector.hide();
        if (window.getSelection().toString()) {
            searchIconHovered = false;
            selector.css({
                top: textBoundRects.top - selector.outerHeight() + window.scrollY - 10,
                left: (textBoundRects.left + textBoundRects.right) / 2 - selector.outerWidth() / 2,
            })
                .show();
        }
    }
});


function searchDictionary(text) {
    $.get(DICT_URL + text)
        .done(function (data) {
            renderDictionary(data);
        })
        .fail(function (data) {
            renderDictionary(hello);
        });
}


function selectCurrentTab(event) {
    if (activeTabId === event.target.id) {
        return;
    }
    for (let i = 0; i < tabNames.length; i++) {
        $('#' + tabNames[i][1] + 'Content').hide();
    }
    let tablinks = document.getElementsByClassName("tab-button-links");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    activeTabId = event.target.id;
    $('#' + activeTabId + 'Content').show();
    event.target.className += " active";
}


function checkResultsPopupBounds(selector) {
    let top = textBoundRects.top - selector.outerHeight() + window.scrollY - 15;
    let left = (textBoundRects.left + textBoundRects.right) / 2 - selector.outerWidth() / 2;
    let right = left + selector.outerWidth();
    if (top < 0) {
        selector.removeClass('search-results-div-top');
        selector.addClass('search-results-div-bottom');
        selector.css({
            top: textBoundRects.bottom + window.scrollY + 15,
        });
    }
    if (left < 0) {
        selector.css({
            left: 0,
        });
    }
    if (right > window.innerWidth) {
        selector.css({
            left: window.innerWidth - selector.outerWidth(),
        });
    }
}


function renderTabLayout(selector) {
    $('#' + searchIconDivId).hide();
    selector.empty();
    activeTabId = "";

    let tabHeaders = '<div class="tab-headers"></div>';
    selector.append(tabHeaders);

    for (let i = 0; i < tabNames.length; i++) {
        let tabButton = `<a id="${tabNames[i][1]}" class="tab-button-links">${tabNames[i][0]}</a>`;
        $('.tab-headers').append(tabButton);
    }
    $('.tab-button-links').click(this, selectCurrentTab);

    for (let i = 0; i < tabNames.length; i++) {
        let tabContent = `<div id="${tabNames[i][1] + 'Content'}" class="tab-content-div"></div>`;
        selector.append(tabContent);
    }
    selector.removeClass('search-results-div-bottom');
    selector.addClass('search-results-div-top');

    selector.css({
        top: textBoundRects.top - selector.outerHeight() + window.scrollY - 15,
        left: (textBoundRects.left + textBoundRects.right) / 2 - selector.outerWidth() / 2,
    })
        .show();
    $('.tab-button-links').css({
        width: $('.tab-headers').outerWidth() / tabNames.length,
    });
    checkResultsPopupBounds(selector);
    $('#' + tabNames[0][1]).click();
}


$('#' + searchIconDivId).hover(function (event) {
    if (searchIconHovered) return;
    searchIconHovered = true;
    let selectedText = window.getSelection().toString();
    renderTabLayout($('#' + searchResultsPopupId));
    if (selectedText.length <= dictSearchLimit) {
        searchDictionary(selectedText);
    }
    else {
        renderDictionary(hello);
    }
});


window.addEventListener('click', function (event) {
    let selector = $('#' + searchResultsPopupId);
    if (!(event.target.id === searchResultsPopupId || $(event.target).parents("#" + searchResultsPopupId).length)) {
        selector.hide();
    }
});


function renderDictionary(meaningList) {
    let selector = $('#dictionaryContent');
    selector.empty();
    for (let context of meaningList) {
        let contextDiv = document.createElement('div');
        contextDiv.className = 'word-context-div';

        let wordHeading = document.createElement('p');
        wordHeading.className = 'word-heading';
        wordHeading.innerText = context['word'];
        contextDiv.appendChild(wordHeading);

        if (context['phonetic']) {
            let wordPhonetic = document.createElement('p');
            wordPhonetic.className = 'word-phonetic';
            wordPhonetic.innerText = context['phonetic'];
            contextDiv.appendChild(wordPhonetic);
        }

        if (context['origin']) {
            let wordOriginDiv = document.createElement('div');
            let wordOriginHeading = document.createElement('p');
            wordOriginHeading.className = 'word-origin-heading';
            wordOriginHeading.innerText = 'Origin: ';
            wordOriginDiv.appendChild(wordOriginHeading);
            let wordOrigin = document.createElement('p');
            wordOrigin.className = 'word-origin';
            wordOrigin.innerText = context['origin'];
            wordOriginDiv.appendChild(wordOrigin);
            contextDiv.appendChild(wordOriginDiv);
        }

        let meaningDiv = document.createElement('div');
        meaningDiv.className = 'word-meaning-div';

        if (context['meanings']) {
            for (let meaning of context['meanings']) {
                if (!jQuery.isEmptyObject(meaning['definitions'][0])) {
                    let partOfSpeech = document.createElement('p');
                    partOfSpeech.className = 'part-of-speech';
                    partOfSpeech.innerText = meaning['partOfSpeech'] + ':';
                    meaningDiv.appendChild(partOfSpeech);

                    let definitionsDiv = document.createElement('div');
                    definitionsDiv.className = 'word-definitions-div';

                    for (let definition of meaning['definitions']) {
                        let defn = document.createElement('li');
                        defn.className = 'word-meaning-defn';
                        defn.innerText = definition['definition'];
                        definitionsDiv.appendChild(defn);

                        if (definition['example']) {
                            let example = document.createElement('p');
                            example.className = 'word-defn-example';
                            example.innerText = '"' + definition['example'] + '"';
                            definitionsDiv.appendChild(example);
                        }
                    }
                    meaningDiv.appendChild(definitionsDiv);
                }
            }
        }
        contextDiv.appendChild(meaningDiv);
        selector.append(contextDiv);
    }
}