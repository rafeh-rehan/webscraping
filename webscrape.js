// Server for hosting webcrawler
const axios = require("axios");
const cheerio = require("cheerio");

async function main(maxPages = 2) {
  console.log("Webcrawling...");

  // Initialization
  // Websites to search
  const baseURLs = ["https://www.kijiji.ca"]
  // Search bar result of private tutor search
  const paginationURLsToVisit = ["https://www.kijiji.ca/b-tutor-language-lessons/"
                                 +"gta-greater-toronto-area/c169l1700272"];
  // Array to track URLs already visited
  const visitedURLs = [];
  // Set to ensure no duplicate Tutor URLs are recorded
  const productURLs = new Set();

  // Iterate through each base URL
  for (var i = 0; i < baseURLs.length; i++) {
    const baseURL = baseURLs[i];

    //
    // i=0 -> Webscrape logic for Kijiji
    // => Replace with function call if Craigslist similar

    if (i == 0) {
      // Iterate through queue of URLs
      while (
        paginationURLsToVisit.length !== 0 &&
        visitedURLs.length <= maxPages
      ) {

        // Set paginationURL from list of URLs to visit
        const paginationURL = paginationURLsToVisit.pop();

        // Download HTML content from current webpage
        const pageHTML = await axios.get(paginationURL);
        // Wait 50 ms
        //await new Promise(r => setTimeout(r,50));

        // Append current URL to list of visitedURLs
        visitedURLs.push(paginationURL);
        //console.log(visitedURLs.length)

        // Load HTML content for current webpage
        const $ = cheerio.load(pageHTML.data);

        // Retrieve page number URLs
        $("a").each((index, element) => {
          const paginationURL = $(element).attr("href");

          // Add pagination URL to the queue of web pages
          // to crawl, if not crawled already

          // Filter URLs to only grab page numbers
          if (
            !visitedURLs.includes(baseURL + paginationURL) &&
            !paginationURLsToVisit.includes(baseURL + paginationURL) &&
            paginationURL != undefined &&
            paginationURL.includes("page") &&
            !paginationURL.includes("TopAds") &&
            !paginationURL.includes("rss")
          ) {
            paginationURLsToVisit.push(baseURL + paginationURL);
            //console.log("Added "+ baseURL + paginationURL);
          }
        });

        // Retrive Tutor URLs
        $("a.title").each((index, element) => {
          const productURL = $(element).attr("href");
          productURLs.add(baseURL + productURL);

          // Check product URL after every grab (for debugging)
          //console.log(productURL);
        });

      }

      // log crawler results
      console.log([...productURLs]);

      // Dump Kijiji webscrape data collected from each baseURL
      // into postgreserver
      const productURLs_Array = Array.from(productURLs);
      const totalData = await kijijiParse(productURLs_Array)
      console.log(totalData)

    }

  }

// Function for parsing webscraped Kijiji data
async function kijijiParse(productURLs) {
  // Init array to store all data
  const totalData = new Set();

  // Loop through paginationURLs of each webscraped Tutor
  while (productURLs.length !== 0) {
    // Grab specific tutor page URL
    const productURL = productURLs.pop();

    // Download HTML content from current webpage
    const pageHTML = await axios.get(productURL);
    // Load HTML content for current webpage
    const $ = cheerio.load(pageHTML.data);

    // Init array for collecting data per productURL
    var data = [];
    // Retrieve ad titles
    const adTitle = $("h1.title-2323565163").contents().first().text();
    // Retrieve ad description
    const adDesc = $("p").contents().first().text();
    // Retrive location
    const adLoc = $("span.address-3617944557").contents().first().text();
    // Retrive last posted date
    const adDate = $("div.datePosted-383942873").attr("content");

    // Store all data into temp data to be pushed into totalData
    data.push(adTitle, adDesc, adLoc, adDate, productURL);
    totalData.add(data);
  }

  return totalData;
}


  // Add here to add data at END of total webscrape
}

main()
  .then(() => {
    // Successful ending
    process.exit(0);
  })
  .catch((e) => {
    // Log error messages
    console.error(e);

    // Unsuccessful ending
    process.exit(1);
  });
