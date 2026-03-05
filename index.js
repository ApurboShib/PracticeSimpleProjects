const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Use environment port in production, fallback to 3000 locally.
const port = process.env.PORT || 3000

const app = express();

// Parse JSON requests and allow cross-origin requests.
app.use(express.json());
app.use(cors());

// Parse form data, serve static assets, and enable EJS templating.
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");


// Home route: load all task files and render them as cards.
app.get("/", (req, res) => {
    // Read all files from storage folder.
    fs.readdir('./files', function (err, files) {
        if (err) {
            // If storage is unavailable, render an empty list instead of crashing.
            return res.render("index", { tasks: [] });
        }

        let tasks = [];
        let count = 0;
        // Render immediately when no files exist.
        if (files.length === 0) {
            return res.render("index", { tasks: [] });
        }

        // Read each file and build task objects for the UI.
        files.forEach(function (file) {
            fs.readFile(`./files/${file}`, "utf-8", function (err, filedata) {
                if (!err) {
                    tasks.push({
                        // Filename (without extension) is used as display title.
                        title: file.split('.')[0],
                        details: filedata,
                        filename: file
                    });
                }
                count++;
                // Render after all asynchronous file reads complete.
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

// handle the edit features...
app.get("/edit/:filename", (req, res) => {
    // Extract target filename from URL.
    const filename = req.params.filename;

    // Load existing content so the edit form can be pre-filled.
    fs.readFile(`./files/${filename}`, "utf-8", function (err, filedata) {
        if (err) {
            return res.status(404).send("File not found");
        }

        res.render("edit", {
            title: filename.replace(/\.txt$/i, ""),
            details: filedata,
            filename: filename
        });
    });
})

// Update task content after form submission.
app.post("/edit/:filename", (req, res) => {
    const filename = req.params.filename;
    // Fallback to empty string if textarea is not sent.
    const updatedDetails = req.body.details || "";

    // Overwrite file with latest content.
    fs.writeFile(`./files/${filename}`, updatedDetails, function (err) {
        if (err) {
            return res.status(500).send("Could not update file");
        }

        // Redirect to details page of the updated task.
        res.redirect(`/files/${encodeURIComponent(filename)}`);
    });
})


app.post("/create", (req, res) => {
    // Log submitted payload for debugging during development.
    console.log(req.body);
    // Normalize title into a filesystem-safe filename.
    const title = req.body.name.trim().replace(/[^a-z0-9]/gi, '_');
    if (!title) return res.redirect("/");
    // create the file where the data will store.
    fs.writeFile(`./files/${title}.txt`, req.body.details, function (err) {
        res.redirect("/");
    });
});

// Start HTTP server.
app.listen(port, () => {
    console.log(`The server is running on port : ${port}`);
})