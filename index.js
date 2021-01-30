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
let JSONContent = {
  path: "",
  content: []
}
const fileCanUse = () => {
  return new Promise((resolve, reject) => {
    for (let [fileName, filePath] of Object.entries(files)) {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          reject(err)
        } else {
          try {
            let status = true
            let jsonData = JSON.parse(data)
            for (const [key, value] of Object.entries(jsonData)) {
              JSONContent.path = key
              JSONContent.content = value
            }
            for (let i = 0; i < JSONContent.content.length; i++) {
              if (JSONContent.content[i].id === undefined) {
                status = false
              }
            }
            resolve(status)
          } catch (err) {
            reject(err)
          }
        }
      })
    }
  })
}


if (argv._.length === 0 && argv.watch === undefined) {
  console.log('MissingArgs')
} else {
  if (argv._.length !== 0) {
    if (checkFiles(argv._)) {
      setPort()
      createServer(false)
      showLogs()
    } else {
      console.log("FileError")
    }
  } else if (argv.watch !== undefined) {
    if (checkFiles([argv.watch])) {
      setPort()
      fileCanUse().then(value => {
        if (value) {
          createServer(true)
          showLogs(true)
        } else {
          console.log("FileErrorForWatchType")
        }
      })
    } else {
      console.log("FileError")
    }
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

function createServer(isWatch) {
  const app = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.writeHead(200)
    if (isWatch) {
      if (JSONContent.path === req.url.split("/")[1] && req.url.split("/").length === 2) {
        res.end(JSON.stringify(JSONContent.content))
      } else if (JSONContent.path === req.url.split("/")[1] && req.url.split("/").length === 3) {
        if (checkInJSONContent(parseInt(req.url.split("/")[2]))) {
          res.end(JSON.stringify(getInJSONContent(parseInt(req.url.split("/")[2]))))
        } else {
          res.end(JSON.stringify(info))
        }
      }else {
        res.end(JSON.stringify(info))
      }
    } else {
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
    }
  })
  app.listen(port)
}

function checkInJSONContent(id) {
  let status = false
  for (let i = 0; i < JSONContent.content.length; i++) {
    if (id === JSONContent.content[i].id) {
      status = true
    }
  }
  return status
}

function getInJSONContent(id) {
  for (let i = 0; i < JSONContent.content.length; i++) {
    if (id === JSONContent.content[i].id) {
      return JSONContent.content[i]
    }
  }
  return null
}

function showLogs(isWatch) {
  let info = []
  isWatch ? info["data_table"] = JSONContent.path : null
  info["port"] = port
  info["base_url"] =`http://localhost:${port}`
  info["server_status"] = "online"
  if (isWatch) {
    info.push({
      description: `List all ${JSONContent.path} as JSON`,
      url: `http://localhost:${port}/${JSONContent.path}`,
    })

    info.push({
      description: `Get single ${JSONContent.path.endsWith("ies") ? JSONContent.path.slice(0, JSONContent.path.length-3) : JSONContent.path.slice(0, JSONContent.path.length-1)} with id as JSON`,
      url: `http://localhost:${port}/${JSONContent.path}/:id`,
    })
  } else {
    for (let [path] of Object.entries(files)) {
      info.push({
        file: `${path}.json`,
        url: `http://localhost:${port}/${path}`
      })
    }
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


