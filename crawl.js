#!/usr/bin/env node
const Apify = require('apify');
const { engine } = require('web-crawljs');
const { program } = require('commander');
const { constructPseudoUrlInstances } = require('apify/build/enqueue_links/shared');
const { URL } = require("url");
const urlmodule = require("valid-url");

const isValidURL = (value, dummyPrevious) => {
  const result = urlmodule.isUri(value);
  if (!result) {
        throw new Error("Parameter is not a valid URL.");
    }
    return value;
  }

  function parseWorkers(value, dummyPrevious) {
    // convert to decimal and validate min and max
    const parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue)) {
      throw new Error('Not a number.');
    }
    if (parsedValue<1 || parsedValue>10) {
        throw new Error('Number must be between 1 and 10.');
    }
    return parsedValue;
  }

program
    .name('crawl')
    .argument('<url>', 'URL to parse', isValidURL)
    .option('-n, --number <workers>', 'Number of workers', parseWorkers)
    .usage("Crawls a given page and print links in console")
    .action((url, options) => {
      const workers = options.number;

      Apify.main(async () => {
        const requestQueue = await Apify.openRequestQueue();
        await requestQueue.addRequest({ url: url });

        const mainURL = new URL(url);
        const r = new RegExp('^(?:[a-z]+:)?//', 'i')

        const crawler = new Apify.CheerioCrawler({
          requestQueue,
          handlePageFunction: async ({ request, $ }) => {
              console.log(request.url);
  
              const data = $('a');
              for (const post of data) {
                  const url = $(post).attr('href');
                  if (r.test(url)) {
                    const parsedURL = new URL(url);
                    if (parsedURL.hostname==mainURL.hostname) {
                      await Apify.utils.enqueueLinks({
                        $,
                        requestQueue,
                        baseUrl: url,
                      });
                    }
                  } else {
                    if (url!=undefined && url!="" && url!="#") {
                      let parsedURL = "";
                      if (url[0]=="/") parsedURL = mainURL.protocol+"//"+mainURL.hostname+url;
                      else parsedURL = mainURL.protocol+"//"+mainURL.hostname+"/"+url;

                      await Apify.utils.enqueueLinks({
                        $,
                        requestQueue,
                        baseUrl: parsedURL,
                      });

                    }
                  }
              }
  

          },
      });
  
      // Run the crawler and wait for it to finish.
      await crawler.run();        

    });
  });

program.parse();




 
