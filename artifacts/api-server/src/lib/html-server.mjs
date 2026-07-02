import http from "http";
import fs from "fs";

const PORT = process.env.PORT;
const FILE = process.env.HTML_FILE;

const html = fs.readFileSync(FILE, "utf-8");

http.createServer((_req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(html);
}).listen(PORT, () => {
  console.log(`HTML server on port ${PORT}`);
});
