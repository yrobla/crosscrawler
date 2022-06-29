#!/usr/bin/env node
const axios = require("axios");
const cheerio = require("cheerio");
const fastq = require("fastq").promise;
const program = require('commander');
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

async function worker(item) {
  console.log(item);

  try {
    const { data } = await axios.get(item);
    const $ = cheerio.load(data);
    const r = new RegExp('^(?:[a-z]+:)?//', 'i')

    // collect all links
    const links = $("a");
    links.each((index, item) => {
      const url =item.attribs["href"];
      if (r.test(url)) {
        const parsedURL = new URL(url);
        if (parsedURL.hostname==mainURL.hostname) {
          if (!visited.includes(url)) {
            // split query and hash, and add it
            url = url.split(/[?#]/)[0];
            queue.push(url);
            visited.push(url);
          }
        }
      } else {
        if (url!=undefined && url!="" && url!="#") {
          let parsedURL = "";
          if (url[0]=="/") parsedURL = mainURL.protocol+"//"+mainURL.hostname+url;
          else parsedURL = mainURL.protocol+"//"+mainURL.hostname+"/"+url;

          if (!visited.includes(parsedURL)) {
            parsedURL = parsedURL.split(/[?#]/)[0];            
            queue.push(parsedURL);
            visited.push(parsedURL);
          }
        }
      }

    });
  } catch(err) {
    console.log(err);
  }
};

var mainURL = "";
var queue;
var visited = [];

program
    .name('crawl')
    .argument('<url>', 'URL to parse', isValidURL)
    .option('-n, --number <workers>', 'Number of workers', parseWorkers)
    .usage("Crawls a given page and print links in console")
    .action((url, options) => {
      queue = fastq(worker, options.number);
      mainURL = new URL(url);
      queue.push(url);
      visited.push(url);
    });

program.parse();




 
