const express = require('express');
const fs = require('fs');
const { main } = require('./main'); // Replace with the path to your main script
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send(`
    <form action="/submit" method="post">
      <label for="urls">Nhập URL (1 link trên mỗi dòng):</label><br>
      <textarea id="urls" name="urls" rows="4" cols="50"></textarea><br>
      <label for="keyword">Keyword</label><br>
      <input type="text" id="keyword" name="keyword"><br><br>
      <input type="submit" value="Submit">
    </form>
  `);
});

app.post('/submit', async (req, res) => {
    const urls = req.body.urls.split('\n');
    const keyword = req.body.keyword;
    const urlsFilename = 'filelink.txt'; // Name of the file to save URLs
     const resultsFilename = 'results.txt';
    fs.writeFileSync(urlsFilename, '');
    fs.writeFileSync(urlsFilename, urls.join('\n'));
    
    try {
        await main(urlsFilename, keyword);
        // Read the results file and send its contents in the response
        const results = fs.readFileSync(resultsFilename, "utf8");
        res.send(`
          <h2>Results:</h2>
          <pre>${results}</pre>
          <a href="/">Gửi yêu cầu khác</a>
        `);
      } catch (error) {
        res.status(500).send(`Error processing URLs: ${error.message}`);
      }

    // // Here you call your main function
    // main(urlsFilename, keyword).then(() => {
    //     res.send("URLs processed successfully. Check the results in the output file.");
    // }).catch(error => {
    //     res.status(500).send(`Error processing URLs: ${error.message}`);
    // });
});



app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});