const fs = require("fs");
const puppeteer = require("puppeteer");
const axios = require("axios");
const https = require("https");
const { url } = require("inspector");

async function fetchWithAxios(url) {
    try {
        const response = await axios.get(url);
        if (response.status === 200 && response.headers["content-type"].includes("text/html")) {
            return response.data;
        } else {
            throw new Error(`Invalid content type: ${response.headers["content-type"]}`);
        }
    } catch (error) {
        throw new Error(`Failed to fetch with Axios: ${error.message}`);
    }
}

function appendToFile(data, filename) {
    fs.appendFileSync(filename, data + "\n", "utf8");
}

async function fetchWithPuppeteer(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });
    const content = await page.content();
    await browser.close();
    return content;
}
async function checkKeyword(url, keyword) {
    try {
        let content = await fetchWithAxios(url);

        if (content.toLowerCase().includes(keyword.toLowerCase())) {
            return { url, found: true, method: "server-side" };
        }

        content = await fetchWithPuppeteer(url);
        return {
            url,
            found: content.toLowerCase().includes(keyword.toLowerCase()),
            method: "client-side",
        };
    } catch (error) {
        return { url, error: error.message };
    }
}

// async function processInBatches(urls, batchSize, keyword, outputFile) {
//     for (let i = 0; i < urls.length; i += batchSize) {
//         const batch = urls.slice(i, i + batchSize);
//         await Promise.all(batch.map(async (url) => {
//             if (url) {
//                 const trimmedUrl = url.trim();
//                 console.log(`Checking URL: ${trimmedUrl}`);
//                 const result = await checkKeyword(trimmedUrl, keyword);
//                 let outputLine = result.error ? `${url} 2` : (result.found ? `${url} 1` : `${url} 0`);
//                 appendToFile(outputLine, outputFile);
//             }
//         }));
//     }
// }
async function processInBatches(urls, batchSize, keyword) {
    let results = new Array(urls.length).fill(null);
  
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(async (url, index) => {
        if (url) {
          const trimmedUrl = url.trim();
          console.log(`Checking URL: ${trimmedUrl}`);
          return checkKeyword(trimmedUrl, keyword);
        }
        return null;
      }));
  
      batchResults.forEach((result, index) => {
        results[i + index] = result;
      });
    }
  
    return results;
  }
  function writeResultsToFile(urls, results, outputFile) {
    results.forEach((result, index) => {
      const url = urls[index] ? urls[index].trim() : "Unknown URL";
      if (result) {
        let outputLine = `${url}: ` + (result.error ? "Error" : (result.found ? "1" : "0"));
        appendToFile(outputLine, outputFile);
      } else {
        appendToFile(`${url}: 0`, outputFile); // Default value for empty or failed URLs
      }
    });
    appendToFile("/////", outputFile);
  }
  
  async function main(urlsFilename, keyword) {
    try {
      const urls = fs.readFileSync(urlsFilename, "utf8").split("\n");
      const outputFile = "results.txt";
      fs.writeFileSync(outputFile, '');
      const batchSize = 5; // Modify as needed
  
      const results = await processInBatches(urls, batchSize, keyword);
      writeResultsToFile(urls, results, outputFile);
    } catch (error) {
      console.error(`Error in main function: ${error.message}`);
      throw error; // Rethrow the error to handle it in the server
    }
  }
  
  module.exports = { main }; // Export the main function
  // async function main() {
//     try {
//         const urls = fs.readFileSync("filelink.txt", "utf8").split("\n");
//         const keyword = "Giá cửa nhôm xingfa";
//         const outputFile = "results.txt";
//         const batchSize = 5; // Modify as needed

//         await processInBatches(urls, batchSize, keyword, outputFile);
//         appendToFile("/////", outputFile);
//     } catch (error) {
//         console.error(`Error in main function: ${error.message}`);
//     }
// }
// main();