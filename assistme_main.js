let pointerDivTag = '<div id="searchIcon" class="pointer-div">' +
    '<i class="fa fa-lg fa-search fa-search-change" aria-hidden="true"></i></div>';

let errorSearchIcon = '<i class="fa fa-lg fa-search fa-search-error" aria-hidden="true"></i>'

$('body').append(pointerDivTag);


let searchIconDivId = 'searchIcon';
let searchResultsPopupId = 'searchResults';
let searchResultsPopupClass = 'search-results-div';
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
let activeTabId = [];
let searchIconHovered = false;
let popupCount = 0;

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
    let dictContentSelector = $('#dictionaryContent_' + popupCount);
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
    let webSearchSelector = $('#webSearchContent_' + popupCount);
    $.get(WEB_API, query)
        .done(function (results) {
            renderWebSearchResults(results, webSearchSelector);
        })
        .fail(function () {
            webSearchError(webSearchSelector);
        });
}


function selectCurrentTab(event) {
    let countId = parseInt(event.target.id.split('_')[1]);
    if (activeTabId[countId] == event.target.id) {
        return;
    }
    for (let i = 0; i < tabNames.length; i++) {
        $('#' + tabNames[i][1] + 'Content_' + countId).hide();
    }
    let tablinks = document.getElementsByClassName("tab-button-links");
    for (let i = 0; i < tablinks.length; i++) {
        if (tablinks[i].id.split('_')[1] == String(countId))
            tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    activeTabId[countId] = event.target.id;
    $('#' + event.target.id.split('_')[0] + 'Content_' + countId).show();
    event.target.className += " active";
}


function checkResultsPopupBounds(resultsDivSelector) {
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
    let resultsDivSelector = $('#' + searchResultsPopupId + '_' + popupCount);
    resultsDivSelector.empty();
    activeTabId[popupCount] = "";

    let tabHeaders = `<div class="tab-headers" id="${'tab-headers_' + popupCount}"></div>`;
    resultsDivSelector.append(tabHeaders);
    let tabHeaderSelector = $('#tab-headers_' + popupCount);
    for (let i = 0; i < tabNames.length; i++) {
        let tabButton = `<a id="${tabNames[i][1] + '_' + popupCount}" class="tab-button-links">${tabNames[i][0]}</a>`;
        tabHeaderSelector.append(tabButton);
    }
    let tabLinksSelector = $('.tab-button-links');
    tabLinksSelector.click(this, selectCurrentTab);

    for (let i = 0; i < tabNames.length; i++) {
        let tabContent = `<div id="${tabNames[i][1] + 'Content_' + popupCount}" class="tab-content-div"></div>`;
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
    checkResultsPopupBounds(resultsDivSelector);
    $('#' + tabNames[0][1] + '_' + popupCount).click();
}


searchIconSelector.hover(function () {
    if (searchIconHovered) return;
    searchIconHovered = true;
    let selectedText = window.getSelection().toString();
    searchIconSelector.hide();
    let popupDiv = `<div id="${'searchResults_' + popupCount}" class="search-results-div search-results-card"></div>`;
    $('body').append(popupDiv);
    renderTabLayout();
    if (selectedText.length <= dictSearchLimit) {
        searchDictionary(selectedText);
    }
    else {
        dictionaryError($('#dictionaryContent_' + popupCount));
    }
    if (selectedText.length <= webSearchLimit) {
        searchWeb(selectedText);
    }
    else {
        webSearchError($('#webSearchContent_' + popupCount));
    }
    popupCount++;
});


window.addEventListener('click', function (event) {
    let searchResultsPopup = $(event.target).parents("." + searchResultsPopupClass);
    if (!(searchResultsPopup.length)) {
        $('.' + searchResultsPopupClass).remove();
        popupCount = 0;
    }
    else {
        let idCount = parseInt(searchResultsPopup[0].id.split('_')[1]);
        for (let i = idCount + 1; i < popupCount; i++) {
            $('#' + searchResultsPopupId + '_' + i).remove();
        }
        popupCount = idCount + 1;
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