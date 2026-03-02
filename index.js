const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const port = process.env.PORT || 3000

const app = express();

app.use(express.json());
app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");


app.get("/", (req, res) => {
    fs.readdir('./files', function (err, files) {
        if (err) {
            return res.render("index", { tasks: [] });
        }

        let tasks = [];
        let count = 0;
        if (files.length === 0) {
            return res.render("index", { tasks: [] });
        }

        files.forEach(function (file) {
            fs.readFile(`./files/${file}`, "utf-8", function (err, filedata) {
                if (!err) {
                    tasks.push({
                        title: file.split('.')[0],
                        details: filedata,
                        filename: file
                    });
                }
                count++;
                if (count === files.length) {
                    res.render("index", { tasks: tasks });
                }
            });
        });
    });
});

// handle the read more features...
app.get("/files/:filename", (req, res) => {
    // read the selected file and pass its content to the show view.
    fs.readFile(`./files/${req.params.filename}`, "utf-8", function (err, filedata) {
        if (err) {
            return res.status(404).send("File not found");
        }

        res.render("show", {
            title: req.params.filename.replace(/\.txt$/i, ""),
            details: filedata,
            filename: req.params.filename
        });
    })
})

app.post("/create", (req, res) => {
    console.log(req.body);
    const title = req.body.name.trim().replace(/[^a-z0-9]/gi, '_');
    if (!title) return res.redirect("/");
    // create the file where the data will store.
    fs.writeFile(`./files/${title}.txt`, req.body.details, function (err) {
        res.redirect("/");
    });
});

app.listen(port, () => {
    console.log(`The server is running on port : ${port}`);
})