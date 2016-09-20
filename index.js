#!/usr/bin/env node

'use strict';

var Crawler = require('simplecrawler'),
    request = require('request'),
    cheerio = require('cheerio');

const BASE_PAGE = '';

var crawler = new Crawler(BASE_PAGE);
crawler.maxDepth = 1;

var results = [];
var responsiveCrawlerCount = 0;
var mainDone = false;

crawler.addFetchCondition(function (queueItem, referrerQueueItem) {
    return queueItem.url.indexOf(BASE_PAGE) === 0;
});

crawler.on('fetchcomplete', function (queueItem, responseBuffer) {
    var $ = cheerio.load(responseBuffer.toString('utf8'));

    $('.box').each(function (i, elem) {
        var tmp = $(this).find('.website').find('.text').contents()[0];
        var website = tmp ? tmp.data : '';

        tmp = $(this).find('.teilnehmertelefon').find('.nummer').contents()[0];
        var phone = tmp ? tmp.data : '';

        tmp = $(this).find('.name').find('span').contents()[0];
        var name = tmp ? tmp.data : '';

        tmp = $(this).find('.adresse').find('span[itemprop="streetAddress"]').contents()[0];
        var street = tmp ? tmp.data : '';

        tmp = $(this).find('.adresse').find('span[itemprop="postalCode"]').contents()[0];
        var postalCode = tmp ? tmp.data : '';

        tmp = $(this).find('.adresse').find('span[itemprop="addressLocality"]').contents()[0];
        var locality = tmp ? tmp.data : '';

        // ignore if we can't get the name
        if (!name) return;

        // console.error('');
        // console.error('Name:', name);
        // console.error('Street:', street);
        // console.error('Location: %s - %s', postalCode, locality);
        // console.error('Phone:', phone);
        // console.error('Website:', website);
        // console.error('');

        var output = {
            name: name,
            phone: phone,
            street: street,
            postalCode: postalCode,
            locality: locality,
            website: website,
            responsive: false
        };

        if (website) {
            var responsive = false;
            ++responsiveCrawlerCount;

            request({ uri: website }, function (error, response, body) {
                --responsiveCrawlerCount;

                if (!error) {
                    var $ = cheerio.load(body);

                    responsive = !!$('meta[name="viewport"]').length;
                    output.responsive = responsive;
                }

                results.push(output);

                end();
            });
        } else {
            results.push(output);
        }
    });
});

function end() {
    if (!mainDone || responsiveCrawlerCount > 0) return;
    console.log(JSON.stringify({ results: results }, null, 4));
}

crawler.on('complete', function () {
    mainDone = true;
    end();
});

crawler.start();
