document.addEventListener("DOMContentLoaded", () => {
    const searchForm = document.querySelector("#searchForm");
    const searchInput = document.querySelector("#search");
    const resultsList = document.querySelector("#results");

    resultsList.classList.add("grid", "grid-cols-2", "gap-6", "mt-4", "overflow-y-auto");
    resultsList.style.maxHeight = "70vh";

    const API_KEY = "d945f49ceffa4302ba9ac5eab97aba8f";

    if (!searchForm || !searchInput || !resultsList) {
        console.error("Error: Required elements not found.");
        return;
    }

    searchForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await searchRecipes();
    });

    async function searchRecipes() {
        const searchValue = searchInput.value.trim();
        if (!searchValue) {
            resultsList.innerHTML = "<p class='text-red-500 text-lg font-semibold'>Please enter at least one ingredient.</p>";
            return;
        }

        resultsList.innerHTML = "<p class='col-span-2 text-gray-600 text-lg font-semibold'>Fetching recipes...</p>";

        const formattedIngredients = searchValue.replace(/\s+/g, "").split(",").join(",");
        const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${formattedIngredients}&number=5&apiKey=${API_KEY}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const data = await response.json();

            if (!data || data.length === 0) {
                resultsList.innerHTML = "<p class='col-span-2 text-gray-700 text-lg font-semibold'>No recipes found. Try different ingredients.</p>";
                return;
            }

            displayRecipes(data);
        } catch (error) {
            console.error("API Error:", error);
            resultsList.innerHTML = `<p class='col-span-2 text-red-500 text-lg font-semibold'>Error: ${error.message}. Check your API key and internet connection.</p>`;
        }
    }

    async function displayRecipes(recipes) {
        resultsList.innerHTML = ""; 

        for (const recipe of recipes) {
            try {
                const detailsResponse = await fetch(`https://api.spoonacular.com/recipes/${recipe.id}/information?includeNutrition=false&apiKey=${API_KEY}`);
                if (!detailsResponse.ok) throw new Error("Failed to fetch recipe details.");
                
                const detailsData = await detailsResponse.json();
                
                const ingredientsList = detailsData.extendedIngredients
                    ? detailsData.extendedIngredients.map(ing => `- ${ing.original}`).join("<br>")
                    : "No ingredient details available.";

                const instructions = detailsData.analyzedInstructions.length > 0
                    ? detailsData.analyzedInstructions[0].steps
                        .map(step => `<p>Step ${step.number}: ${step.step}</p>`)
                        .join("")
                    : "<p>No instructions available.</p>";


                const usedIngredients = recipe.usedIngredients && recipe.usedIngredients.length > 0
                    ? recipe.usedIngredients.map(ing => ing.original).join(", ")
                    : "None";
                const missedIngredients = recipe.missedIngredients && recipe.missedIngredients.length > 0
                    ? recipe.missedIngredients.map(ing => ing.original).join(", ")
                    : "None";

                const recipeCard = `
                    <div class="bg-white p-6 rounded-lg shadow-lg transition hover:shadow-xl max-w-lg mx-auto">
                        <img src="${detailsData.image}" alt="${detailsData.title}" class="w-full h-40 object-cover rounded">
                        <h3 class="text-2xl font-bold mt-2 text-gray-900">${detailsData.title}</h3>
                        <p class="text-sm text-gray-700 mt-1"><strong>Ready in:</strong> ${detailsData.readyInMinutes} mins</p>
                        <p class="text-sm text-gray-700"><strong>Servings:</strong> ${detailsData.servings}</p>
                        <h4 class="text-lg font-semibold mt-3">Used Ingredients:</h4>
                        <p class="text-sm text-gray-700">${usedIngredients}</p>
                        <h4 class="text-lg font-semibold mt-3">Missed Ingredients:</h4>
                        <p class="text-sm text-gray-700">${missedIngredients}</p>
                        <h4 class="text-lg font-semibold mt-3">Ingredients:</h4>
                        <p class="text-sm text-gray-700">${ingredientsList}</p>
                        <h4 class="text-lg font-semibold mt-3">Instructions:</h4>
                        <div class="text-sm text-gray-700">${instructions}</div>
                    </div>
                `;

                resultsList.insertAdjacentHTML("beforeend", recipeCard);
            } catch (error) {
                console.warn("Error fetching recipe details:", error);
                resultsList.insertAdjacentHTML(
                    "beforeend",
                    `<p class='col-span-2 text-red-500 text-lg font-semibold'>Error loading recipe details.</p>`
                );
            }
        }
    }
});
