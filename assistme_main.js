let popupTag = '<div id="searchResults" class="search-results-div search-results-card"></div>';

let pointerDivTag = '<div id="searchIcon" class="pointer-div">' +
    '<i class="fa fa-lg fa-search fa-search-change" aria-hidden="true"></i></div>';

let errorSearchIcon = '<i class="fa fa-lg fa-search fa-search-error" aria-hidden="true"></i>'

$('body').append(popupTag);
$('body').append(pointerDivTag);


let searchIconDivId = 'searchIcon';
let searchResultsPopupId = 'searchResults';
let DICT_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
let WEB_API = 'http://localhost:8000/search/';
let dictSearchLimit = 20;
let webSearchLimit = 100;
let textBoundRects;
let tabNames = [
    ['Dictionary', 'dictionary'],
    ['Web Search', 'webSearch'],
    ['Suggestion', 'suggestion'],
];
let searchIconSelector = $('#' + searchIconDivId);
let resultsDivSelector = $('#' + searchResultsPopupId);
let activeTabId = "";
let searchIconHovered = false;


$(document).on({
    'selectionchange': function () {
        textBoundRects = window.getSelection().getRangeAt(0).getBoundingClientRect();
        searchIconSelector.hide();
        if (window.getSelection().toString()) {
            searchIconHovered = false;
            searchIconSelector.css({
                top: textBoundRects.top - searchIconSelector.outerHeight() + window.scrollY - 10,
                left: (textBoundRects.left + textBoundRects.right) / 2 - searchIconSelector.outerWidth() / 2,
            })
                .show();
        }
    }
});


function searchDictionary(text) {
    let dictContentSelector = $('#dictionaryContent');
    $.get(DICT_URL + text)
        .done(function (data) {
            renderDictionary(data, dictContentSelector);
        })
        .fail(function () {
            dictionaryError(dictContentSelector);
        });
}


function searchWeb(text) {
    let query = {query_string: text};
    let webSearchSelector = $('#webSearchContent');
    $.get(WEB_API, query)
        .done(function (results) {
            renderWebSearchResults(results, webSearchSelector);
        })
        .fail(function () {
            webSearchError(webSearchSelector);
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


function checkResultsPopupBounds() {
    let left = (textBoundRects.left + textBoundRects.right) / 2 - resultsDivSelector.outerWidth() / 2;
    let right = left + resultsDivSelector.outerWidth();
    if (left < 0) {
        resultsDivSelector.css({
            left: 0,
        });
    }
    if (right > window.innerWidth) {
        resultsDivSelector.css({
            left: window.innerWidth - resultsDivSelector.outerWidth(),
        });
    }
}


function renderTabLayout() {
    resultsDivSelector.empty();
    activeTabId = "";

    let tabHeaders = '<div class="tab-headers"></div>';
    resultsDivSelector.append(tabHeaders);
    let tabHeaderSelector = $('.tab-headers');
    for (let i = 0; i < tabNames.length; i++) {
        let tabButton = `<a id="${tabNames[i][1]}" class="tab-button-links">${tabNames[i][0]}</a>`;
        tabHeaderSelector.append(tabButton);
    }
    let tabLinksSelector = $('.tab-button-links');
    tabLinksSelector.click(this, selectCurrentTab);

    for (let i = 0; i < tabNames.length; i++) {
        let tabContent = `<div id="${tabNames[i][1] + 'Content'}" class="tab-content-div"></div>`;
        resultsDivSelector.append(tabContent);
    }
    resultsDivSelector.removeClass('search-results-div-top');
    resultsDivSelector.addClass('search-results-div-bottom');

    resultsDivSelector.css({
        top: textBoundRects.bottom + window.scrollY + 15,
        left: (textBoundRects.left + textBoundRects.right) / 2 - resultsDivSelector.outerWidth() / 2,
    })
        .show();
    tabLinksSelector.css({
        width: tabHeaderSelector.outerWidth() / tabNames.length,
    });
    checkResultsPopupBounds();
    $('#' + tabNames[0][1]).click();
}


searchIconSelector.hover(function () {
    if (searchIconHovered) return;
    searchIconHovered = true;
    let selectedText = window.getSelection().toString();
    searchIconSelector.hide();
    renderTabLayout();
    if (selectedText.length <= dictSearchLimit) {
        searchDictionary(selectedText);
    }
    else {
        dictionaryError($('#dictionaryContent'));
    }
    if (selectedText.length <= webSearchLimit) {
        searchWeb(selectedText);
    }
    else {
        webSearchError($('#webSearchContent'));
    }
});


window.addEventListener('click', function (event) {
    if (!(event.target.id === searchResultsPopupId || $(event.target).parents("#" + searchResultsPopupId).length)) {
        resultsDivSelector.hide();
    }
});


function renderDictionary(meaningList, dictSelector) {
    dictSelector.empty();
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
        dictSelector.append(contextDiv);
    }
}


function dictionaryError(dictSelector) {
    dictSelector.empty();
    let meaningErrorDiv = document.createElement('div');
    meaningErrorDiv.className = 'error-div';
    meaningErrorDiv.innerHTML = errorSearchIcon;

    let errorMessage = document.createElement('p');
    errorMessage.innerText = 'Sorry, we couldn\'t find definitions for the word you were looking for.';
    errorMessage.className = 'error-message';

    let errorResolution = document.createElement('p');
    errorResolution.innerText = 'You can try the search again or head to the web instead.';
    errorResolution.className = 'error-resolution';

    meaningErrorDiv.appendChild(errorMessage);
    meaningErrorDiv.appendChild(errorResolution);
    dictSelector.append(meaningErrorDiv);
}


function renderWebSearchResults(results, webSearchSelector) {
    webSearchSelector.empty();
    for (let result of results) {
        let resultDiv = document.createElement('div');
        resultDiv.className = 'single-result-div';

        let namepara = document.createElement('p');
        namepara.className = 'result-name-para';
        let name = document.createElement('a');
        name.className = 'result-name-link';
        name.href = result['link'];
        name.target = '_blank';
        name.innerText = result['name'];
        namepara.appendChild(name);
        resultDiv.appendChild(namepara);

        let linkpara = document.createElement('p');
        linkpara.className = 'result-link-para';
        let link = document.createElement('a');
        link.className = 'result-link-link';
        link.href = result['link'];
        link.target = '_blank';
        link.innerText = result['link'];
        linkpara.appendChild(link);
        resultDiv.appendChild(linkpara);

        if (result['description']) {
            let description = document.createElement('p');
            description.className = 'result-desc-class';
            description.innerText = result['description'];
            resultDiv.appendChild(description);
        }
        webSearchSelector.append(resultDiv);
    }
}


function webSearchError(webSearchSelector) {
    webSearchSelector.empty();
    let searchErrorDiv = document.createElement('div');
    searchErrorDiv.className = 'error-div';
    searchErrorDiv.innerHTML = errorSearchIcon;

    let errorMessage = document.createElement('p');
    errorMessage.innerText = 'Sorry, we couldn\'t find results for your query.';
    errorMessage.className = 'error-message';

    let errorResolution = document.createElement('p');
    errorResolution.innerText = 'You can try the search again or head to the web instead.';
    errorResolution.className = 'error-resolution';

    searchErrorDiv.appendChild(errorMessage);
    searchErrorDiv.appendChild(errorResolution);
    webSearchSelector.append(searchErrorDiv);
}