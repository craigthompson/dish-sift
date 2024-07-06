import firstRecipeData from "./edaman_get_recipes_v2_no_query.json" assert { type: "json" };
import { createWriteStream } from "fs";
import JSONStream from "JSONStream";
import axios from "axios";

let iterations = 0;

// total number of recipes
let count = firstRecipeData.count;

let writeStream = createWriteStream(
  `./database/seeding/recipeJSONs/all_recipes_${iterations}.json`
);
let jsonStream = JSONStream.stringify();
jsonStream.pipe(writeStream);

const populateJSON = async (currentRecipeBatch) => {
  // array to hold recipes from a singe API response
  const batchRecipes = [];

  try {
    console.log("currentRecipeBatch.to: ", currentRecipeBatch.to);
    if (currentRecipeBatch.to >= count) {
      jsonStream.end();

      writeStream.on("finish", () => {
        console.log("Large JSON file has been written successfully.");
      });

      writeStream.on("error", (err) => {
        console.error("Error writing large JSON file:", err);
      });
      console.log("All done!");
      return;
    }

    iterations++;
    console.log("iterations:", iterations);
    currentRecipeBatch.hits.map((el) => {
      batchRecipes.push(el);
    });

    batchRecipes.forEach((recipe) => {
      jsonStream.write(recipe);
    });

    let nextUrl = currentRecipeBatch._links.next.href;
    nextUrl = nextUrl.replace(/(\&ingr\=\-99|\&type\=public)+/g, "");
    console.log("nextUrl:", nextUrl);

    const res = await axios.get(nextUrl, {
      params: {
        app_id: process.env.EDAMAM_APP_ID,
        app_key: process.env.EDAMAM_APP_KEY,
        type: "public",
        ingr: 1 - 100,
      },
    });

    count = res.data.count;
    console.log("Available recipes count:", count);


    if (iterations % 20 === 0) {
      jsonStream.end();
      writeStream.on("finish", () => {
        console.log("Large JSON file has been written successfully.");
      });
      writeStream = createWriteStream(
        `./database/seeding/recipeJSONs/all_recipes_${iterations / 20}.json`
      );
      jsonStream = JSONStream.stringify();
      jsonStream.pipe(writeStream);
    }

    // time delay here
    setTimeout(() => populateJSON(res.data), 6667);
  } catch (err) {
    console.log("***ERROR***:", err);
  }
};

populateJSON(firstRecipeData);