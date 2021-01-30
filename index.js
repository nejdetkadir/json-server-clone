const yargs = require('yargs/yargs')
const path = require("path")
const fs = require('fs')
const http = require('http')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv
const pjson = require('./package.json')

const info = {
  name: pjson.name,
  version: pjson.version,
  description: pjson.description,
  author: pjson.author,
  license: pjson.license
}

let port = 5555
let files = {}

if (argv._.length === 0) {
  console.log('MissingArgs')
} else {
  if (checkFiles(argv._)) {
    setPort()
    createServer()
    showLogs()
  } else {
    console.log("FileError")
  }
}

function setPort() {
  if (argv.port !== undefined) {
    if (typeof argv.port === "number" && argv.port.toString().length === 4) {
      port = argv.port
    }
  }
}

function createServer() {
  const app = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.writeHead(200)
    if (files[req.url.split("/")[1]] !== undefined) {
      fs.readFile(files[req.url.split("/")[1]], 'utf8', function (err,data) {
        if (err) {
          res.end('{"error": "file error"}')
        } else {
          res.end(data)
        }
      })
    } else {
      res.end(JSON.stringify(info))
    }
  })
  app.listen(port)
}

function showLogs() {
  let info = []
  info["port"] = port
  info["base_url"] =`http://localhost:${port}`
  info["server_status"] = "online"
  for (let [path] of Object.entries(files)) {
    info.push({
      file: `${path}.json`,
      url: `http://localhost:${port}/${path}`
    })
  }
  console.log(info)
}

function checkFiles(arr) {
  let status = true
  arr.forEach(file => {
    if (file.endsWith(".json"))  {
      let filePath = path.join(__dirname) + "/" + file
      if (!fs.existsSync(filePath)) {
        status = false
      } else {
        if (files[`${file.split("/")[file.split("/").length-1].split(".")[0]}`] === undefined) {
          files[`${file.split("/")[file.split("/").length-1].split(".")[0]}`] = filePath
        } else {
          if (filePath === files[`${file.split("/")[file.split("/").length-1].split(".")[0]}`]) {
            console.log('SameFileError')
            status = false
          } else  {
            status = false
            console.log("SameNameOfFileError")
          }
        }
      }
    } else {
      status = false
    }
  })
  return status
}
