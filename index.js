const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

const url = "https://kimetsu-no-yaiba.fandom.com/wiki/Kimetsu_no_Yaiba_Wiki";
const characterUrl = "https://kimetsu-no-yaiba.fandom.com/wiki/";

// Setup
const app = express();
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());
dotenv.config();
app.use(
    bodyParser.urlencoded({
        limit: "50mb",
        extended: true,
        parameterLimit: 50000,
    })
);

// Routes

// Get all characters
app.get("/v1", (req, res) => {
    const thumbnails = [];
    try {
        axios(url).then((axiosRes) => {
            const html = axiosRes.data;
            const $ = cheerio.load(html);
            $(".portal", html).each(function () {
                const name = $(this).find("a").attr("title");
                const url = $(this).find("a").attr("href");
                const image = $(this).find("a > img").attr("data-src");
                thumbnails.push({
                    name: name,
                    url: "http://localhost:8000/v1" + url.split("/wiki")[1],
                    image: image,
                });
            });

            res.status(200).json(thumbnails);
        });
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get a character
app.get("/v1/:character", (req, res) => {
    let url = characterUrl + req.params.character;
    const titles = [];
    const details = [];
    const characters = [];
    const galleries = [];
    const characterObj = {};
    try {
        axios(url).then((axiosRes) => {
            const html = axiosRes.data;
            const $ = cheerio.load(html);

            // Get gallery
            $(".wikia-gallery-item", html).each(function () {
                const gallery = $(this).find("a > img").attr("data-src");
                galleries.push(gallery);
            });

            $("aside", html).each(function () {
                // Get banner image
                const image = $(this).find("img").attr("src");

                // Get the title
                $(this)
                    .find("section > div > h3")
                    .each(function () {
                        titles.push($(this).text());
                    });

                // Get character details
                $(this)
                    .find("section > div > div")
                    .each(function () {
                        details.push($(this).text());
                    });

                if (image !== undefined) {
                    // Create object with title as key and details as value
                    for (let i = 0; i < titles.length; ++i) {
                        characterObj[titles[i].toLowerCase()] = details[i];
                    }
                    characters.push({
                        name: req.params.character.replace("_", " "),
                        gallery: galleries,
                        image: image,
                        ...characterObj,
                    });
                }
            });

            res.status(200).json(characters);
        });
    } catch (error) {
        res.status(500).json(error);
    }
});

// Run port
app.listen(8000, () => console.log("Server is running..."));
