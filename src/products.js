/* scrape */
import { join } from "path";
import { readFile } from "fs/promises";
import neatCsv from "neat-csv";

// import { writeFile } from "fs/promises";

import ObjectsToCsv from "objects-to-csv";

import spiderCore from "spider-core";
import { executablePath, headless, __dirname } from "../config";

const proxiesFile = join(__dirname, "./proxies.txt");
const subCategories = join(__dirname, "./files/Subcategories.csv");
const productslinks = join(__dirname, "./files/Products.csv");

const { launchBrowser } = spiderCore;

const visitSubCategory = async (page, url) => {
    let productsLinksDetails = [];

    try {
        console.log(`Opening ${url}...\n`);
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60 * 1000 });
    } catch (err) {
        console.error("Unable to open url", err);
        return productsLinksDetails;
    }

    // await page.waitForTimeout(500000000);
    const getProductData = async () => {
        try {
            console.log("Extracting Products...");
            const products = await page.evaluate((url) => {
                const prdInfo = [];
                const products = document.querySelectorAll('.aim a.core[data-dimension44="0"]');

                const reg = url.match(/\b(?=ng)\w.*/g);
                const newReg = reg[0].replaceAll("ng/", "");

                products.forEach((category) => {
                    let productName;
                    let productUrl;
                    let subCategory;

                    try {
                        productName = category.innerText;
                    } catch (e) {}

                    try {
                        productUrl = category.href;
                    } catch (e) {}

                    try {
                        subCategory = newReg.replaceAll("/", "");
                    } catch (e) {}

                    prdInfo.push({
                        Sub_category: subCategory,
                        Sub_category_url: url,
                        Product_name: productName,
                        Product_url: productUrl,
                    });
                });

                return prdInfo;
            }, url);

            productsLinksDetails = [...productsLinksDetails, ...new Set(products)];

            console.log(productsLinksDetails);
        } catch (err) {
            console.error("Could not extarct products link!", err);
        }

        // await closePage();
        return productsLinksDetails;
    };

    let hasNextPage = true;
    while (hasNextPage === true) {
        console.log();
        await getProductData();

        try {
            console.log("Clicking Next Page...");
            await page
                .waitForSelector('[aria-label="Next Page"]', { timeout: 5000 })
                .then((x) =>
                    Promise.all([
                        page.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {}),
                        x.evaluate((x) => x.click()),
                    ])
                );
        } catch (err) {
            console.error("Unable to click Next Page. We are probably at the end of the page", err);
            hasNextPage = false;
            break;
        }
        await page.waitForTimeout(2500);
    }

    return productsLinksDetails;
};

const getProductsLinks = async () => {
    const [createNewPage, exitBrowser] = await launchBrowser({ executablePath, headless, proxiesFile });

    const [page] = await createNewPage();
    if (!page) return console.error("Page was not opened");

    let productsLinksDetails = [];

    await readFile(subCategories)
        .then(neatCsv)
        .then(async (data) => {
            const subCategoriesLenght = data.length;
            if (!Array.isArray(data) || subCategoriesLenght < 1)
                return console.log("No data to work with!, Sub categories file is empty");
            const urls = data.map((x) => x.Sub_category_url);

            for (const url of urls) {
                if (!url || typeof url !== "string") return console.log("Invalid url!");
                const productsLinks = await visitSubCategory(page, url);

                productsLinksDetails = [...productsLinksDetails, ...new Set(productsLinks)];

                console.log(productsLinks.length, "New products link extracted...");
                console.log("Total of", productsLinksDetails.length, "Products links.\n");
            }
        });

    console.log();
    await exitBrowser();

    console.log("Saving products to csv...");
    new ObjectsToCsv(productsLinksDetails)
        .toDisk(productslinks)
        .then(console.log("Products sucessfully saved to Csv.."))
        .catch((e) => console.error("Products data could not be saved!", e));
};

export default getProductsLinks;
